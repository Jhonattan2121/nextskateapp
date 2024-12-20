import * as url from "url"

export interface LinkWithDomain {
  url: string
  domain: string
}

export function extractLinksFromMarkdown(
  markdownContent: string
): LinkWithDomain[] {
  const linkRegex = /!\[.*?\]\((.*?)\)/g
  const links = markdownContent.match(linkRegex) || []

  const linksWithDomains: LinkWithDomain[] = links.map((link) => {
    const urlMatch = link.match(/\[.*?\]\((.*?)\)/)
    const fullUrl = urlMatch ? urlMatch[1] : ""
    const parsedUrl = url.parse(fullUrl)
    const domain = parsedUrl.hostname || ""
    return { url: fullUrl, domain }
  })

  return linksWithDomains
}

export function extractIFrameLinks(htmlContent: string): LinkWithDomain[] {
  const iframeRegex = /<iframe.*?src=["']([^"']*)["']/gi
  const iframes = htmlContent.match(iframeRegex) || []

  const iframeWithDomains: LinkWithDomain[] = iframes.map((iframe) => {
    const srcMatch = iframe.match(/src=["']([^"']*)["']/)
    const fullSrc = srcMatch ? srcMatch[1] : ""
    const parsedSrc = url.parse(fullSrc)
    const domain = parsedSrc.hostname || ""
    return { url: fullSrc, domain }
  })

  return iframeWithDomains
}

export function extractCustomLinks(inputText: string): LinkWithDomain[] {
  const customLinkRegex = /https:\/\/3speak\.tv\/watch\?v=[\w\d\-\/]+/gi
  const customLinks = inputText.match(customLinkRegex) || []

  const customLinkSet = new Set<string>()
  const customLinksWithDomains: LinkWithDomain[] = []

  for (const link of customLinks) {
    if (!customLinkSet.has(link)) {
      customLinkSet.add(link)
      const parsedUrl = new URL(link)
      const domain = parsedUrl.hostname || ""
      customLinksWithDomains.push({
        url: link.replace("watch", "embed"),
        domain,
      })
    }
  }

  return customLinksWithDomains
}

export function transform3SpeakContent(content: string): string {
  const regex =
    /\[!\[\]\((https:\/\/ipfs-3speak\.b-cdn\.net\/ipfs\/[a-zA-Z0-9]+\/)\)\]\((https:\/\/3speak\.tv\/watch\?v=([a-zA-Z0-9-_]+\/[a-zA-Z0-9]+))\)/
  const match = content.match(regex)

  if (match) {
    const videoID = match[3]
    const iframe = `<iframe src="https://3speak.tv/embed?v=${videoID}" allowtransparency="true" allowFullScreen="true"></iframe>`
    content = content.replace(regex, iframe)
  }
  return content
}
