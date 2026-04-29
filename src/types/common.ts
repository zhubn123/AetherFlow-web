export type IdValue = string | number

export interface PageResult<T> {
  pageNo: number
  pageSize: number
  total: number
  pages: number
  records: T[]
}
