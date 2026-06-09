/// <reference types="vite/client" />

// 声明全局常量类型
declare const __API_BASE_URL__: string
declare const __OAUTH_CALLBACK_BASE_URL__: string
declare const __DEV_SERVER_PORT__: string

/// <reference types="node" />
declare namespace NodeJS {
    type Timeout = any;
}