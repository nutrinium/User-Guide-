/** Parse bullet steps from section content + content-type media (mirrors ViewerGuide.jsx). */
export function parseSteps(section, contentItems = []) {
  const steps = []

  contentItems.forEach((item) => {
    if (item.contentText?.trim()) {
      item.contentText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => steps.push(line.replace(/^\d+[\).\s]+/, '')))
    }
  })

  if (section?.content?.trim()) {
    section.content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        const cleaned = line.replace(/^\d+[\).\s]+/, '')
        if (!steps.includes(cleaned)) steps.push(cleaned)
      })
  }

  if (steps.length === 0 && section?.content?.trim()) {
    steps.push(section.content.trim())
  }

  return steps
}
