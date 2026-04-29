<template>
  <div class="wms-page">
    <header class="page-header">
      <div>
        <h1>库存查询</h1>
        <p>按仓库、区域、库位、物料维度查看当前与锁定库存。</p>
      </div>
      <RouterLink to="/dashboard"><el-button plain>返回首页</el-button></RouterLink>
    </header>

    <section class="panel">
      <h2>查询条件</h2>
      <div class="field-grid">
        <div class="field">
          <label>仓库</label>
          <el-select v-model="queryWarehouseId" placeholder="全部" clearable @change="onWarehouseChange">
            <el-option
              v-for="item in warehouseOptions"
              :key="String(item.id)"
              :label="`${item.warehouseCode} - ${item.warehouseName}`"
              :value="String(item.id)"
            />
          </el-select>
        </div>
        <div class="field">
          <label>区域</label>
          <el-select v-model="queryAreaId" placeholder="全部" clearable @change="onAreaChange">
            <el-option
              v-for="item in areaOptions"
              :key="String(item.id)"
              :label="`${item.areaCode} - ${item.areaName}`"
              :value="String(item.id)"
            />
          </el-select>
        </div>
        <div class="field">
          <label>库位</label>
          <el-select v-model="queryLocationId" placeholder="全部" clearable>
            <el-option
              v-for="item in locationOptions"
              :key="String(item.id)"
              :label="`${item.locationCode} - ${item.locationName}`"
              :value="String(item.id)"
            />
          </el-select>
        </div>
        <div class="field">
          <label>物料</label>
          <el-select v-model="queryMaterialId" placeholder="全部" clearable>
            <el-option
              v-for="item in materialOptions"
              :key="String(item.id)"
              :label="`${item.materialCode} - ${item.materialName}`"
              :value="String(item.id)"
            />
          </el-select>
        </div>
        <div class="field">
          <label>库存下限</label>
          <el-input-number v-model="query.minQuantity" :min="0" :step="0.001" placeholder="可选" />
        </div>
        <div class="field">
          <label>库存上限</label>
          <el-input-number v-model="query.maxQuantity" :min="0" :step="0.001" placeholder="可选" />
        </div>
      </div>
      <div class="actions-row">
        <el-button type="primary" :disabled="loading" @click="handleSearch">查询</el-button>
        <el-button :disabled="loading" @click="resetQuery">重置</el-button>
      </div>
    </section>

    <section class="panel">
      <h2>库存列表</h2>
      <el-alert v-if="errorMessage" class="message" type="error" :closable="false" :show-icon="true" :title="errorMessage" />
      <el-table :data="rows" v-loading="loading" empty-text="暂无数据">
        <el-table-column label="仓库" min-width="180">
          <template #default="{ row }">{{ renderWarehouse(row) }}</template>
        </el-table-column>
        <el-table-column label="区域" min-width="180">
          <template #default="{ row }">{{ renderArea(row) }}</template>
        </el-table-column>
        <el-table-column label="库位" min-width="180">
          <template #default="{ row }">{{ renderLocation(row) }}</template>
        </el-table-column>
        <el-table-column label="物料" min-width="200">
          <template #default="{ row }">{{ renderMaterial(row) }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="当前库存" min-width="120" />
        <el-table-column prop="lockedQuantity" label="锁定库存" min-width="120" />
      </el-table>
      <WmsPagination
        :current-page="query.pageNo"
        :page-size="query.pageSize"
        :total="total"
        :pages="pages"
        :disabled="loading"
        @current-change="onPageChange"
        @page-size-change="onPageSizeChange"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import WmsPagination from '@/components/WmsPagination.vue'
import { queryAreas, queryInventories, queryLocations, queryMaterials, queryWarehouses, type InventoryQuery } from '@/api/wms'
import type { Area, Inventory, Location, Material, Warehouse } from '@/types/wms'

const loading = ref(false)
const rows = ref<Inventory[]>([])
const total = ref(0)
const pages = ref(0)
const errorMessage = ref('')
const queryWarehouseId = ref('')
const queryAreaId = ref('')
const queryLocationId = ref('')
const queryMaterialId = ref('')
const warehouseOptions = ref<Warehouse[]>([])
const areaOptions = ref<Area[]>([])
const locationOptions = ref<Location[]>([])
const materialOptions = ref<Material[]>([])

const query = reactive<InventoryQuery>({
  pageNo: 1,
  pageSize: 5,
  warehouseId: undefined,
  areaId: undefined,
  locationId: undefined,
  materialId: undefined,
  minQuantity: undefined,
  maxQuantity: undefined
})

function normalizeNumberRange(): void {
  if (query.minQuantity !== undefined && Number.isNaN(query.minQuantity)) {
    query.minQuantity = undefined
  }
  if (query.maxQuantity !== undefined && Number.isNaN(query.maxQuantity)) {
    query.maxQuantity = undefined
  }
}

function normalizeQuery(): void {
  query.warehouseId = queryWarehouseId.value ? queryWarehouseId.value : undefined
  query.areaId = queryAreaId.value ? queryAreaId.value : undefined
  query.locationId = queryLocationId.value ? queryLocationId.value : undefined
  query.materialId = queryMaterialId.value ? queryMaterialId.value : undefined
}

async function loadAreaOptions(): Promise<void> {
  if (!queryWarehouseId.value) {
    areaOptions.value = []
    return
  }
  const result = await queryAreas({ pageNo: 1, pageSize: 200, warehouseId: queryWarehouseId.value, status: 0 })
  areaOptions.value = result.records
}

async function loadLocationOptions(): Promise<void> {
  const result = await queryLocations({
    pageNo: 1,
    pageSize: 200,
    warehouseId: queryWarehouseId.value || undefined,
    areaId: queryAreaId.value || undefined,
    status: 0
  })
  locationOptions.value = result.records
}

async function onWarehouseChange(): Promise<void> {
  queryAreaId.value = ''
  queryLocationId.value = ''
  await loadAreaOptions()
  await loadLocationOptions()
}

async function onAreaChange(): Promise<void> {
  queryLocationId.value = ''
  await loadLocationOptions()
}

function resetQuery(): void {
  query.pageNo = 1
  queryWarehouseId.value = ''
  queryAreaId.value = ''
  queryLocationId.value = ''
  queryMaterialId.value = ''
  query.warehouseId = undefined
  query.areaId = undefined
  query.locationId = undefined
  query.materialId = undefined
  query.minQuantity = undefined
  query.maxQuantity = undefined
  areaOptions.value = []
  void loadLocationOptions()
  void loadData()
}

function handleSearch(): void {
  query.pageNo = 1
  void loadData()
}

async function loadData(): Promise<void> {
  errorMessage.value = ''
  normalizeQuery()
  normalizeNumberRange()
  loading.value = true
  try {
    const result = await queryInventories(query)
    rows.value = result.records
    total.value = result.total
    pages.value = Math.max(result.pages, 1)
    query.pageNo = result.pageNo
    query.pageSize = result.pageSize
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '库存加载失败'
  } finally {
    loading.value = false
  }
}

async function loadOptions(): Promise<void> {
  const [warehouses, materialsPage] = await Promise.all([
    queryWarehouses({ pageNo: 1, pageSize: 200 }),
    queryMaterials({ pageNo: 1, pageSize: 200, status: 0 })
  ])
  warehouseOptions.value = warehouses
  materialOptions.value = materialsPage.records
  await loadLocationOptions()
}

function renderWarehouse(row: Inventory): string {
  if (row.warehouseCode || row.warehouseName) {
    const code = row.warehouseCode || '-'
    const name = row.warehouseName || '-'
    return `${code} - ${name}`
  }
  const found = warehouseOptions.value.find((item) => String(item.id) === String(row.warehouseId))
  if (!found) {
    return `#${row.warehouseId}`
  }
  return `${found.warehouseCode} - ${found.warehouseName}`
}

function renderArea(row: Inventory): string {
  if (row.areaCode || row.areaName) {
    const code = row.areaCode || '-'
    const name = row.areaName || '-'
    return `${code} - ${name}`
  }
  if (!row.areaId) {
    return '-'
  }
  const found = areaOptions.value.find((item) => String(item.id) === String(row.areaId))
  if (!found) {
    return `#${row.areaId}`
  }
  return `${found.areaCode} - ${found.areaName}`
}

function renderLocation(row: Inventory): string {
  if (row.locationCode || row.locationName) {
    const code = row.locationCode || '-'
    const name = row.locationName || '-'
    return `${code} - ${name}`
  }
  const found = locationOptions.value.find((item) => String(item.id) === String(row.locationId))
  if (!found) {
    return `#${row.locationId}`
  }
  return `${found.locationCode} - ${found.locationName}`
}

function renderMaterial(row: Inventory): string {
  if (row.materialCode || row.materialName) {
    const code = row.materialCode || '-'
    const name = row.materialName || '-'
    return `${code} - ${name}`
  }
  const found = materialOptions.value.find((item) => String(item.id) === String(row.materialId))
  if (!found) {
    return `#${row.materialId}`
  }
  return `${found.materialCode} - ${found.materialName}`
}

function onPageChange(pageNo: number): void {
  if (pageNo === query.pageNo) {
    return
  }
  query.pageNo = pageNo
  void loadData()
}

function onPageSizeChange(pageSize: number): void {
  query.pageNo = 1
  query.pageSize = pageSize
  void loadData()
}

onMounted(async () => {
  await loadOptions()
  await loadData()
})
</script>

<style scoped src="./wms-page.css"></style>
