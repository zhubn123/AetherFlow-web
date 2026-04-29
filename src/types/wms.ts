import type { IdValue, PageResult } from '@/types/common'

export type { IdValue, PageResult }

export interface Warehouse {
  id: IdValue
  warehouseCode: string
  warehouseName: string
  status: number
  remark?: string
}

export interface Area {
  id: IdValue
  warehouseId: IdValue
  warehouseCode?: string
  warehouseName?: string
  areaCode: string
  areaName: string
  areaType?: string
  status: number
  remark?: string
}

export interface Location {
  id: IdValue
  warehouseId: IdValue
  warehouseCode?: string
  warehouseName?: string
  areaId: IdValue
  areaCode?: string
  areaName?: string
  locationCode: string
  locationName: string
  status: number
  remark?: string
}

export interface Material {
  id: IdValue
  materialCode: string
  materialName: string
  specification?: string
  unit?: string
  status: number
  remark?: string
}

export interface Inventory {
  id: IdValue
  warehouseId: IdValue
  warehouseCode?: string
  warehouseName?: string
  locationId: IdValue
  areaId?: IdValue
  areaCode?: string
  areaName?: string
  locationCode?: string
  locationName?: string
  materialId: IdValue
  materialCode?: string
  materialName?: string
  quantity: number | string
  lockedQuantity: number | string
}

export interface InventoryAdjustmentItem {
  id?: IdValue
  orderId?: IdValue
  lineNo?: number
  materialId: IdValue
  materialCode?: string
  materialName?: string
  locationId: IdValue
  locationCode?: string
  locationName?: string
  adjustQty: number | string
  remark?: string
}

export interface InboundOrderItem {
  id?: IdValue
  orderId?: IdValue
  lineNo?: number
  materialId: IdValue
  locationId?: IdValue
  plannedQty: number | string
  receivedQty?: number | string
  remark?: string
}

export interface OutboundOrderItem {
  id?: IdValue
  orderId?: IdValue
  lineNo?: number
  materialId: IdValue
  locationId?: IdValue
  plannedQty: number | string
  shippedQty?: number | string
  remark?: string
}

export interface InboundOrder {
  id: IdValue
  orderNo: string
  warehouseId: IdValue
  warehouseCode?: string
  warehouseName?: string
  status: number
  inboundTime?: string
  remark?: string
}

export interface OutboundOrder {
  id: IdValue
  orderNo: string
  warehouseId: IdValue
  warehouseCode?: string
  warehouseName?: string
  status: number
  outboundTime?: string
  remark?: string
}

export interface InventoryAdjustment {
  id: IdValue
  orderNo: string
  warehouseId: IdValue
  warehouseCode?: string
  warehouseName?: string
  areaId: IdValue
  areaCode?: string
  areaName?: string
  adjustType: string
  status: number
  adjustTime?: string
  adjustReason: string
  remark?: string
}

export interface InventoryAdjustmentDetail extends InventoryAdjustment {
  adjustmentItems: InventoryAdjustmentItem[]
}
