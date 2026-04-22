<template>
  <div class="wms-page">
    <header class="page-header">
      <div>
        <h1>库存查询</h1>
        <p>按仓库、库位、物料维度查看当前与锁定库存。</p>
      </div>
      <RouterLink to="/dashboard" class="btn ghost">返回首页</RouterLink>
    </header>

    <WmsNav />

    <section class="panel">
      <h2>查询条件</h2>
      <div class="field-grid">
        <div class="field">
          <label>仓库</label>
          <select v-model="queryWarehouseId">
            <option value="">全部</option>
            <option v-for="item in warehouseOptions" :key="String(item.id)" :value="String(item.id)">
              {{ item.warehouseCode }} - {{ item.warehouseName }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>库位</label>
          <select v-model="queryLocationId">
            <option value="">全部</option>
            <option v-for="item in locationOptions" :key="String(item.id)" :value="String(item.id)">
              {{ item.locationCode }} - {{ item.locationName }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>物料</label>
          <select v-model="queryMaterialId">
            <option value="">全部</option>
            <option v-for="item in materialOptions" :key="String(item.id)" :value="String(item.id)">
              {{ item.materialCode }} - {{ item.materialName }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>库存下限</label>
          <input v-model.number="query.minQuantity" type="number" min="0" step="0.001" placeholder="可选" />
        </div>
        <div class="field">
          <label>库存上限</label>
          <input v-model.number="query.maxQuantity" type="number" min="0" step="0.001" placeholder="可选" />
        </div>
      </div>
      <div class="actions-row">
        <button class="btn" :disabled="loading" @click="handleSearch">查询</button>
        <button class="btn secondary" :disabled="loading" @click="resetQuery">重置</button>
      </div>
    </section>

    <section class="panel">
      <h2>库存列表</h2>
      <div v-if="errorMessage" class="message error">{{ errorMessage }}</div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>仓库</th>
              <th>库位</th>
              <th>物料</th>
              <th>当前库存</th>
              <th>锁定库存</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="String(row.id)">
              <td>{{ renderWarehouse(row) }}</td>
              <td>{{ renderLocation(row) }}</td>
              <td>{{ renderMaterial(row) }}</td>
              <td>{{ row.quantity }}</td>
              <td>{{ row.lockedQuantity }}</td>
            </tr>
            <tr v-if="!rows.length">
              <td class="empty-cell" colspan="5">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <span>共 {{ total }} 条，当前第 {{ query.pageNo }} / {{ pages || 1 }} 页</span>
        <div class="actions-row" style="margin-top: 0;">
          <button class="btn secondary" :disabled="loading || (query.pageNo || 1) <= 1" @click="prevPage">上一页</button>
          <button class="btn secondary" :disabled="loading || (query.pageNo || 1) >= pages" @click="nextPage">下一页</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import WmsNav from '@/components/WmsNav.vue'
import { queryInventories, queryLocations, queryMaterials, queryWarehouses, type InventoryQuery } from '@/api/wms'
import type { Inventory, Location, Material, Warehouse } from '@/types/wms'

const loading = ref(false)
const rows = ref<Inventory[]>([])
const total = ref(0)
const pages = ref(0)
const errorMessage = ref('')
const queryWarehouseId = ref('')
const queryLocationId = ref('')
const queryMaterialId = ref('')
const warehouseOptions = ref<Warehouse[]>([])
const locationOptions = ref<Location[]>([])
const materialOptions = ref<Material[]>([])

const query = reactive<InventoryQuery>({
  pageNo: 1,
  pageSize: 10,
  warehouseId: undefined,
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
  query.locationId = queryLocationId.value ? queryLocationId.value : undefined
  query.materialId = queryMaterialId.value ? queryMaterialId.value : undefined
}

function resetQuery(): void {
  query.pageNo = 1
  queryWarehouseId.value = ''
  queryLocationId.value = ''
  queryMaterialId.value = ''
  query.warehouseId = undefined
  query.locationId = undefined
  query.materialId = undefined
  query.minQuantity = undefined
  query.maxQuantity = undefined
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
  const [warehouses, locationsPage, materialsPage] = await Promise.all([
    queryWarehouses({ pageNo: 1, pageSize: 200 }),
    queryLocations({ pageNo: 1, pageSize: 200, status: 0 }),
    queryMaterials({ pageNo: 1, pageSize: 200, status: 0 })
  ])
  warehouseOptions.value = warehouses
  locationOptions.value = locationsPage.records
  materialOptions.value = materialsPage.records
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

function prevPage(): void {
  if ((query.pageNo || 1) <= 1) {
    return
  }
  query.pageNo = (query.pageNo || 1) - 1
  void loadData()
}

function nextPage(): void {
  if ((query.pageNo || 1) >= pages.value) {
    return
  }
  query.pageNo = (query.pageNo || 1) + 1
  void loadData()
}

onMounted(async () => {
  await loadOptions()
  await loadData()
})
</script>

<style scoped src="./wms-page.css"></style>
