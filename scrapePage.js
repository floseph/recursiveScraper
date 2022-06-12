const puppeteer = require('puppeteer')
const fs = require('fs')


//entry point pass the root URI of the website you want to scrape as parameter
async function scrapePage(rootUri){

 
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

  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  

  async function spoof(){
    const userAgentsRaw = fs.readFileSync('userAgents.txt','utf-8')
    const userAgents = userAgentsRaw.split(/\r?\n/)
    const randomInt = getRandomInt(userAgents.length)
    const randomUserAgent = userAgents[randomInt]
    
    await page.setUserAgent(randomUserAgent)
    
  }

  async function scrape(){

     //array scraped data that gets returned at the end
    const content = []

    const urisToTraverse = []
    //initialize with rootUri
    urisToTraverse.push(rootUri)

    for(let i = 0; i < urisToTraverse.length; i++){
      //await spoof()
      await goToPage(urisToTraverse[i])
      console.log(`Traversing URI # ${i+1} of ${urisToTraverse.length}`)
      console.log(`Scraping >>> ${urisToTraverse[i]}`)
      const emails  = await scrapeLinks()

      emails.forEach( element => {
        //links
        if(element.includes(rootUri) && !urisToTraverse.includes(element) && noOtherFileTypes(element)){
          urisToTraverse.push(element)
        }

        //emails
        if(element.includes('@') && !content.includes(element) && !element.includes('?')){
          content.push(element)
          
          fs.writeFileSync('scrapedMails.txt', content.join('\n'))
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
  console.log('All emails scraped and saved to "scrapedMails.txt" ')

  await browser.close()
}


