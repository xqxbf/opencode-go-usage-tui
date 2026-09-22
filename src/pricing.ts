// 本地模型注册表 → 面板行名的轻量映射
// （官方价格/限额缓存链路已随 2.0.0 移除，面板只展示本地会话用量统计）
export interface LocalModelRow {
  id: string          // 面板行唯一 id（modelID）
  providerID: string
  name: string        // 显示名（取 m.name || modelID）
}

export interface RegistryModel {
  id: string
  providerID: string
  modelID: string
  name: string
}

export function buildLocalRows(registry: RegistryModel[]): LocalModelRow[] {
  return registry.map((m) => ({
    id: m.modelID || m.id,
    providerID: m.providerID,
    name: (m.name || m.modelID || m.id).trim(),
  }))
}