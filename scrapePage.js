const puppeteer = require('puppeteer')
const fs = require('fs')


const navigatedUris = []
const toDoUris = []
const content = []

async function scrapePage(rootUri){

  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.goto(rootUri)
  
  async function goToPage(uri){
    await page.goto(uri)
  }


  async function scrapeBody(){
    const bodyOfPage = await page.evaluate(() => {
      const anchorTags = document.querySelectorAll('body')
      return Array.from(anchorTags).map( (a) => a.textContent)
    })
    return bodyOfPage
  }

  async function scrapeEmails(){
    const bodyOfPage = await page.evaluate(() => {
      const anchorTags = document.querySelectorAll('[id*="email"]')
      return Array.from(anchorTags).map( (a) => a.href)
    })
    return bodyOfPage
  }

  async function scrapeLinks(){
    const linksOfPage = await page.evaluate(() => {
      const anchorTags = document.querySelectorAll('a')
      return Array.from(anchorTags).map( (a) => a.href)
    })
    return linksOfPage
  }

  async function takeScreenshot(path){
    console.log(path)
    await page.screenshot({path: path})
  }

  async function evaluateLinks(){
    const links = await scrapeLinks()
    
    
    //push unscraped uris to todo array
    for(let i = 0; i < links.length; i++){
      if(links[i].includes('http')){
        if(!navigatedUris.includes(links[i])){
          navigatedUris.push(links[i])
          toDoUris.push(links[i])
        }
      }
      
    }
    
  }


  async function recursiveScrapeBody(){
    await evaluateLinks()
    
    // recursion exit condition
    if(toDoUris.length === 0){
      return
    }

    //scrapebody of 
    for(let i = 0; i < toDoUris.length; i++){
      console.log(`Navigating to >>> ${toDoUris[i]}`)
      await goToPage(toDoUris[i])
      const body = await scrapeBody()
      content.push(body)
      // await takeScreenshot(`./screenshots/${}`)
    }
    toDoUris.length = 0

    await recursiveScrapeBody()
  }

  async function recursiveScrapeEmail(){
    await evaluateLinks()
    
    // recursion exit condition
    if(toDoUris.length === 0){
      return
    }

    //scrapebody of 
    for(let i = 0; i < toDoUris.length; i++){
      console.log(`Navigating to >>> ${toDoUris[i]}`)
      await goToPage(toDoUris[i])
      const body = await scrapeEmails()
      content.push(body)
      //await takeScreenshot(`./screenshots/${}`)
    }
    toDoUris.length = 0

    await recursiveScrapeBody()
  }


  await recursiveScrapeBody()
  //await recursiveScrapeEmail()
  console.log(content)



  
  // await goToPage(`${rootUri}/register`)
  // console.log(await scrapeBody())
  // console.log(await scrapeLinks())
  // await takeScreenshot('./screenshots/test.png')
  
  await browser.close()
}

scrapePage('http://127.0.0.1:3000')
