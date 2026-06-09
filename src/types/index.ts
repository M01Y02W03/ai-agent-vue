// 实践案例类型
export interface CaseItem {
  id: number
  title: string
  description: string
  tags: string[]
}

// 贡献者类型
export interface Contributor {
  id: number
  name: string
  mainRoleId: string
  avatar: string
  github?: string
  profileUrl?: string
  contributions: number
  yearlyContributions?: number
  longestStreak?: number
  currentStreak?: number
}

// 技术优势类型
export interface AdvantageDetail {
  title: string
  description: string
}

export interface Advantage {
  id: number
  icon: string
  title: string
  description: string
  learnUrl?: string
  details: AdvantageDetail[]
}

// 代码提交记录类型（用于显示）
export interface CommitRecord {
  id: string
  date: string
  authorName: string
  message: string
}

// 后端提交记录类型（API响应格式）
export interface BackendCommitRecord {
  id: string
  author: {
    name: string
    date: string
    email: string
  }
  message: string
}

// 首页仓库类型常量
export const RepoType = {
  Vue: 0,
  Java: 1,
  Python: 2
} as const

export type RepoType = typeof RepoType[keyof typeof RepoType]

// 首页仓库信息类型
export interface RepoInfo {
  id: RepoType
  name: string
  title: string
}

// 首页作者信息类型
export interface AuthorInfo {
  name: string
  avatarUrl: string
  description: string
  followers: number
  following: number
  stared: number
  watched: number
}