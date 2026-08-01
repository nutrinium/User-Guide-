export function getAppEntryPath(appId, ctx) {
  const {
    getModulesByApplication,
    getPublishedGuidesByModule,
    getPublishedDirectGuidesByApplication,
  } = ctx

  const modules = (getModulesByApplication(appId) || []).filter((m) => m.isActive)
  const directGuides = getPublishedDirectGuidesByApplication(appId)

  const modulesWithGuides = modules.filter(
    (m) => getPublishedGuidesByModule(m.id).length > 0
  )

  if (modulesWithGuides.length === 1) {
    const mod = modulesWithGuides[0]
    const guides = getPublishedGuidesByModule(mod.id)
    if (guides.length > 0) {
      return `/viewer/app/${appId}/module/${mod.id}/guide/${guides[0].id}`
    }
  }

  if (modules.length === 1) {
    const guides = getPublishedGuidesByModule(modules[0].id)
    if (guides.length > 0) {
      return `/viewer/app/${appId}/module/${modules[0].id}/guide/${guides[0].id}`
    }
    return `/viewer/app/${appId}/module/${modules[0].id}`
  }

  if (modulesWithGuides.length === 0 && directGuides.length > 0) {
    return `/viewer/app/${appId}/guide/${directGuides[0].id}`
  }

  if (modulesWithGuides.length > 1) {
    const first = modulesWithGuides[0]
    const guides = getPublishedGuidesByModule(first.id)
    if (guides.length > 0) {
      return `/viewer/app/${appId}/module/${first.id}/guide/${guides[0].id}`
    }
  }

  if (modules.length > 1) {
    return `/viewer/app/${appId}/module/${modules[0].id}`
  }

  return `/viewer/app/${appId}`
}
