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
          <label>仓库ID</label>
          <input v-model.trim="query.warehouseId" type="text" placeholder="可选" />
        </div>
        <div class="field">
          <label>库位ID</label>
          <input v-model.trim="query.locationId" type="text" placeholder="可选" />
        </div>
        <div class="field">
          <label>物料ID</label>
          <input v-model.trim="query.materialId" type="text" placeholder="可选" />
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
              <th>ID</th>
              <th>仓库ID</th>
              <th>库位ID</th>
              <th>物料ID</th>
              <th>当前库存</th>
              <th>锁定库存</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="String(row.id)">
              <td>{{ row.id }}</td>
              <td>{{ row.warehouseId }}</td>
              <td>{{ row.locationId }}</td>
              <td>{{ row.materialId }}</td>
              <td>{{ row.quantity }}</td>
              <td>{{ row.lockedQuantity }}</td>
            </tr>
            <tr v-if="!rows.length">
              <td class="empty-cell" colspan="6">暂无数据</td>
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
import { queryInventories, type InventoryQuery } from '@/api/wms'
import type { Inventory } from '@/types/wms'

const loading = ref(false)
const rows = ref<Inventory[]>([])
const total = ref(0)
const pages = ref(0)
const errorMessage = ref('')

const query = reactive<InventoryQuery>({
  pageNo: 1,
  pageSize: 10,
  warehouseId: '',
  locationId: '',
  materialId: '',
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

function resetQuery(): void {
  query.pageNo = 1
  query.warehouseId = ''
  query.locationId = ''
  query.materialId = ''
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

onMounted(() => {
  void loadData()
})
</script>

<style scoped src="./wms-page.css"></style>
