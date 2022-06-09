const puppeteer = require('puppeteer')
const fs = require('fs')


//entry point pass the root URI of the website you want to scrape as parameter
async function scrapePage(rootUri){

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

  //takes screenshot of current page
  async function takeScreenshot(path){
    console.log(path)
    await page.screenshot({path: path})
  }


  //return true if there are no undesired file externsions present
  function noOtherFileTypes(string){
    return !(string.includes('.jpg') || string.includes('.pdf') || string.includes('.png'))
  }

  async function scrape(){

    const urisToTraverse = []
    //initialize with rootUri
    urisToTraverse.push(rootUri)

    for(let i = 0; i < urisToTraverse.length; i++){
      await goToPage(urisToTraverse[i])
      console.log(`Traversing URI # ${i+1} of ${urisToTraverse.length}`)
      console.log(`Scraping >>> ${urisToTraverse[i]}`)
      const emails  = await scrapeLinks()

      emails.forEach( element => {
        if(element.includes(rootUri) && !urisToTraverse.includes(element) && noOtherFileTypes(element)){
          urisToTraverse.push(element)
        }

        if(element.includes('@') && !content.includes(element)){
          content.push(element)
        }
      })
    }

    const removeMailTo = content.map(element =>{
      return element.replace('mailto:', '')
    })
    return removeMailTo

  }

  const scrapedMails = await scrape()

  fs.writeFileSync('scrapedMails.txt', scrapedMails.join('\n'))

  await browser.close()
}



scrapePage('http://127.0.0.1:3000')
// scrapePage('https://www.zahnarzt-neufahrn.com/')

