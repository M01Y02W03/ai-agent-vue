// Toast UI Editor类型声明
declare module '@toast-ui/editor' {
  interface EditorOptions {
    el: HTMLElement
    height?: string
    initialEditType?: 'markdown' | 'wysiwyg'
    previewStyle?: 'tab' | 'vertical'
    language?: string
    usageStatistics?: boolean
    toolbarItems?: string[][]
    initialValue?: string
  }

  interface Editor {
    setMarkdown(markdown: string): void
    getMarkdown(): string
    destroy(): void
    getHTML(): string
    setHTML(html: string): void
    changeMode(mode: 'markdown' | 'wysiwyg'): void
    insertText(text: string): void
    moveCursorToEnd(): void
    moveCursorToStart(): void
    scrollTop(value: number): void
    getScrollTop(): number
    setHeight(height: string): void
    getHeight(): string
    focus(): void
    blur(): void
    hide(): void
    show(): void
    isViewer(): boolean
    isMarkdownMode(): boolean
    isWysiwygMode(): boolean
    remove(): void
    reset(): void
  }

  class Editor {
    constructor(options: EditorOptions)
  }

  export default Editor
}

declare module '@toast-ui/editor/dist/toastui-editor.css' {
  const content: string
  export default content
}

declare module '@toast-ui/editor/dist/i18n/zh-cn' {
  const content: any
  export default content
}