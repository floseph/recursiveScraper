const puppeteer = require('puppeteer')
const fs = require('fs')


//entry point pass the root URI of the website you want to scrape as parameter
async function scrapePage(rootUri){

  //big index of which sites have already been scraped
  const navigatedUris = []
  //index of which sites to scrape in the current recursion loop
  const toDoUris = []
  //array scraped data that gets returned at the end
  const content = []

  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  //page.setJavaScriptEnabled(false)

 

  //visit root page
  await page.goto(rootUri)
  

  async function goToPage(uri){
    await page.goto(uri)
  }


  

  //scrapes all 'body' elements on current page and returns an array of them
  async function scrapeBody(){
    const bodyOfPage = await page.evaluate(() => {
      const anchorTags = document.querySelectorAll('body')
      return Array.from(anchorTags).map( (a) => a.textContent)
    })
    return bodyOfPage
  }

  //scrapes all elements with an id* = 'email' on current page and returns an array of them
  async function scrapeEmails(){
    const bodyOfPage = await page.evaluate(() => {
      const anchorTags = document.querySelectorAll('a')   //('[id*="email"]')
      return Array.from(anchorTags).map( (a) => a.href)
    })
    return bodyOfPage
  }

  //scrapes all elements with an anchortag on current page and returns an array of them
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

  function isSameDomain(uri){
    return uri.includes(rootUri)
  }


  //scrapes all links on a site and adds them to current toDoUris if they are not in the navigatedUri array
  async function evaluateLinks(){
    const links = await scrapeLinks()
    
    
    //push unscraped uris to todo array
    for(let i = 0; i < links.length; i++){
      if(links[i].includes('http') && !links[i].includes('pdf') && !links[i].includes('jpg') && !links[i].includes('png') && isSameDomain(links[i])){
        if(!navigatedUris.includes(links[i])){
          navigatedUris.push(links[i])
          toDoUris.push(links[i])
        }
      }
    }
  }


  //scrapes all links on the site and scrapes the body of the pages
  async function recursiveScrapeBody(){
    
    await evaluateLinks()
    
    // recursion exit condition
    if(toDoUris.length === 0){
      return
    }

    //scrapebody of toDoUris
    for(let i = 0; i < toDoUris.length; i++){
      console.log(`Navigating to >>> ${toDoUris[i]}`)
      await goToPage(toDoUris[i])
      toDoUris.shift()
      const body = await scrapeBody()
      content.push(body)
    }

    // await goToPage(toDoUris[0])
    // toDoUris.shift()

    await recursiveScrapeBody()

    return content
  }

  async function recursiveScrapeEmail(){

    await evaluateLinks()
    
    // recursion exit condition
    if(toDoUris.length === 0){
      return
    }

    //scrapebody of toDoUris
    for(let i = 0; i < toDoUris.length; i++){
      console.log(`Navigating to >>> ${toDoUris[i]}`)
      await goToPage(toDoUris[i])
      const emails = await scrapeEmails()

      //sanitize email array
      if(emails.length > 0 && emails[0] != null){
        emails.forEach((element) => {
          if(!content.includes(element)){
            content.push(element)
          }
        })
      }
    }

    console.log(`My todo uri counter: >>> ${toDoUris.length}`)
    await goToPage(toDoUris[0])
    toDoUris.shift()
    
    await recursiveScrapeEmail()


  // sanitazies content
  const sanitizedContent = content.filter( (element) => {
    return element.includes('@')
  })

  return sanitizedContent
  }

  
  

  //test functionality
  console.log(await recursiveScrapeEmail())
  // console.log(await recursiveScrapeBody())

  
  await browser.close()
}

// scrapePage('http://127.0.0.1:3000')

