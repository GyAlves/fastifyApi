import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Table {
    id: string
    titles: string
    amount: number
    type: string
    tax: number
    created_at: string
    session_id: string
  }
}
