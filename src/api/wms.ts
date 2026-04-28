import { requestApi } from '@/utils/request'
import type {
  Area,
  IdValue,
  InboundOrder,
  InboundOrderItem,
  InventoryAdjustment,
  InventoryAdjustmentDetail,
  InventoryAdjustmentItem,
  Inventory,
  Location,
  Material,
  OutboundOrder,
  OutboundOrderItem,
  PageResult,
  Warehouse
} from '@/types/wms'

function buildIdsQuery(ids: IdValue[]): string {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return query.toString()
}

export interface WarehouseQuery {
  pageNo?: number
  pageSize?: number
  warehouseCode?: string
  warehouseName?: string
}

export interface LocationQuery {
  pageNo?: number
  pageSize?: number
  warehouseId?: IdValue
  areaId?: IdValue
  locationCode?: string
  locationName?: string
  status?: number
}

export interface AreaQuery {
  pageNo?: number
  pageSize?: number
  warehouseId?: IdValue
  areaCode?: string
  areaName?: string
  areaType?: string
  status?: number
}

export interface MaterialQuery {
  pageNo?: number
  pageSize?: number
  materialCode?: string
  materialName?: string
  status?: number
}

export interface InventoryQuery {
  pageNo?: number
  pageSize?: number
  warehouseId?: IdValue
  areaId?: IdValue
  locationId?: IdValue
  materialId?: IdValue
  minQuantity?: number
  maxQuantity?: number
}

export interface InboundOrderQuery {
  pageNo?: number
  pageSize?: number
  orderNo?: string
  warehouseId?: IdValue
  areaId?: IdValue
  status?: number
}

export interface OutboundOrderQuery {
  pageNo?: number
  pageSize?: number
  orderNo?: string
  warehouseId?: IdValue
  areaId?: IdValue
  status?: number
}

export interface InventoryAdjustmentQuery {
  pageNo?: number
  pageSize?: number
  orderNo?: string
  warehouseId?: IdValue
  areaId?: IdValue
  adjustType?: string
  status?: number
}

export interface InboundOrderDraftPayload {
  warehouseId: IdValue
  remark?: string
  orderItemsBo: InboundOrderItem[]
}

export interface OutboundOrderDraftPayload {
  warehouseId: IdValue
  remark?: string
  orderItemsBo: OutboundOrderItem[]
}

export interface InventoryAdjustmentDraftPayload {
  warehouseId: IdValue
  areaId: IdValue
  adjustType: string
  adjustReason: string
  remark?: string
  adjustmentItemsBo: InventoryAdjustmentItem[]
}

type WarehousePageResponse = PageResult<Warehouse> | Warehouse[]

function toWarehousePageResult(query: WarehouseQuery, result: WarehousePageResponse): PageResult<Warehouse> {
  if (!Array.isArray(result)) {
    return result
  }

  const pageNo = query.pageNo ?? 1
  const pageSize = query.pageSize ?? result.length
  return {
    pageNo,
    pageSize,
    total: result.length,
    pages: 1,
    records: result
  }
}

export async function queryWarehousePage(query: WarehouseQuery): Promise<PageResult<Warehouse>> {
  const result = await requestApi<WarehousePageResponse>({
    url: '/wms/warehouses/page',
    method: 'post',
    data: query
  })
  return toWarehousePageResult(query, result)
}

export async function queryWarehouses(query: WarehouseQuery): Promise<Warehouse[]> {
  const result = await queryWarehousePage(query)
  return result.records
}

export function createWarehouse(data: Partial<Warehouse>): Promise<void> {
  return requestApi<void>({
    url: '/wms/warehouses',
    method: 'post',
    data
  })
}

export function updateWarehouse(data: Partial<Warehouse>): Promise<void> {
  return requestApi<void>({
    url: '/wms/warehouses',
    method: 'put',
    data
  })
}

export function removeWarehouses(ids: IdValue[]): Promise<void> {
  return requestApi<void>({
    url: `/wms/warehouses?${buildIdsQuery(ids)}`,
    method: 'delete'
  })
}

export function queryLocations(query: LocationQuery): Promise<PageResult<Location>> {
  return requestApi<PageResult<Location>>({
    url: '/wms/locations',
    method: 'get',
    params: query
  })
}

export function queryAreas(query: AreaQuery): Promise<PageResult<Area>> {
  return requestApi<PageResult<Area>>({
    url: '/wms/areas',
    method: 'get',
    params: query
  })
}

export function createArea(data: Partial<Area>): Promise<number> {
  return requestApi<number>({
    url: '/wms/areas',
    method: 'post',
    data
  })
}

export function updateArea(id: IdValue, data: Partial<Area>): Promise<boolean> {
  return requestApi<boolean>({
    url: `/wms/areas/${id}`,
    method: 'put',
    data
  })
}

export function removeAreas(ids: IdValue[]): Promise<boolean> {
  return requestApi<boolean>({
    url: `/wms/areas?${buildIdsQuery(ids)}`,
    method: 'delete'
  })
}

export function createLocation(data: Partial<Location>): Promise<number> {
  return requestApi<number>({
    url: '/wms/locations',
    method: 'post',
    data
  })
}

export function updateLocation(id: IdValue, data: Partial<Location>): Promise<boolean> {
  return requestApi<boolean>({
    url: `/wms/locations/${id}`,
    method: 'put',
    data
  })
}

export function removeLocations(ids: IdValue[]): Promise<boolean> {
  return requestApi<boolean>({
    url: `/wms/locations?${buildIdsQuery(ids)}`,
    method: 'delete'
  })
}

export function queryMaterials(query: MaterialQuery): Promise<PageResult<Material>> {
  return requestApi<PageResult<Material>>({
    url: '/wms/materials',
    method: 'get',
    params: query
  })
}

export function createMaterial(data: Partial<Material>): Promise<number> {
  return requestApi<number>({
    url: '/wms/materials',
    method: 'post',
    data
  })
}

export function updateMaterial(id: IdValue, data: Partial<Material>): Promise<boolean> {
  return requestApi<boolean>({
    url: `/wms/materials/${id}`,
    method: 'put',
    data
  })
}

export function removeMaterials(ids: IdValue[]): Promise<boolean> {
  return requestApi<boolean>({
    url: `/wms/materials?${buildIdsQuery(ids)}`,
    method: 'delete'
  })
}

export function queryInventories(query: InventoryQuery): Promise<PageResult<Inventory>> {
  return requestApi<PageResult<Inventory>>({
    url: '/wms/stocks',
    method: 'get',
    params: query
  })
}

export function queryInboundOrders(query: InboundOrderQuery): Promise<PageResult<InboundOrder>> {
  return requestApi<PageResult<InboundOrder>>({
    url: '/wms/inbound-orders',
    method: 'get',
    params: query
  })
}

export function createInboundOrder(data: InboundOrderDraftPayload): Promise<IdValue> {
  return requestApi<IdValue>({
    url: '/wms/inbound-orders',
    method: 'post',
    data
  })
}

export function updateInboundOrder(id: IdValue, data: Partial<InboundOrderDraftPayload>): Promise<boolean> {
  return requestApi<boolean>({
    url: `/wms/inbound-orders/${id}`,
    method: 'put',
    data
  })
}

export function confirmInboundOrder(id: IdValue): Promise<boolean> {
  return requestApi<boolean>({
    url: `/wms/inbound-orders/${id}/actions`,
    method: 'post',
    data: { action: 'CONFIRM' }
  })
}

export function removeInboundOrders(ids: IdValue[]): Promise<boolean> {
  return requestApi<boolean>({
    url: `/wms/inbound-orders?${buildIdsQuery(ids)}`,
    method: 'delete'
  })
}

export function queryOutboundOrders(query: OutboundOrderQuery): Promise<PageResult<OutboundOrder>> {
  return requestApi<PageResult<OutboundOrder>>({
    url: '/wms/outbound-orders',
    method: 'get',
    params: query
  })
}

export function createOutboundOrder(data: OutboundOrderDraftPayload): Promise<IdValue> {
  return requestApi<IdValue>({
    url: '/wms/outbound-orders',
    method: 'post',
    data
  })
}

export function updateOutboundOrder(id: IdValue, data: Partial<OutboundOrderDraftPayload>): Promise<boolean> {
  return requestApi<boolean>({
    url: `/wms/outbound-orders/${id}`,
    method: 'put',
    data
  })
}

export function confirmOutboundOrder(id: IdValue): Promise<boolean> {
  return requestApi<boolean>({
    url: `/wms/outbound-orders/${id}/actions`,
    method: 'post',
    data: { action: 'CONFIRM' }
  })
}

export function removeOutboundOrders(ids: IdValue[]): Promise<boolean> {
  return requestApi<boolean>({
    url: `/wms/outbound-orders?${buildIdsQuery(ids)}`,
    method: 'delete'
  })
}

export function queryInventoryAdjustments(query: InventoryAdjustmentQuery): Promise<PageResult<InventoryAdjustment>> {
  return requestApi<PageResult<InventoryAdjustment>>({
    url: '/wms/inventory-adjustments',
    method: 'get',
    params: query
  })
}

export function getInventoryAdjustmentDetail(id: IdValue): Promise<InventoryAdjustmentDetail> {
  return requestApi<InventoryAdjustmentDetail>({
    url: `/wms/inventory-adjustments/${id}`,
    method: 'get'
  })
}

export function createInventoryAdjustment(data: InventoryAdjustmentDraftPayload): Promise<IdValue> {
  return requestApi<IdValue>({
    url: '/wms/inventory-adjustments',
    method: 'post',
    data
  })
}

export function updateInventoryAdjustment(id: IdValue, data: Partial<InventoryAdjustmentDraftPayload>): Promise<boolean> {
  return requestApi<boolean>({
    url: `/wms/inventory-adjustments/${id}`,
    method: 'put',
    data
  })
}

export function confirmInventoryAdjustment(id: IdValue): Promise<boolean> {
  return requestApi<boolean>({
    url: `/wms/inventory-adjustments/${id}/actions`,
    method: 'post',
    data: { action: 'CONFIRM' }
  })
}

export function removeInventoryAdjustments(ids: IdValue[]): Promise<boolean> {
  return requestApi<boolean>({
    url: `/wms/inventory-adjustments?${buildIdsQuery(ids)}`,
    method: 'delete'
  })
}
