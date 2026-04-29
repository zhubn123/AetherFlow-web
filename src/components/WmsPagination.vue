<template>
  <div class="wms-pagination">
    <span class="wms-pagination__text">共 {{ total }} 条</span>
    <span class="wms-pagination__text">第 {{ safeCurrentPage }} / {{ pageCount }} 页</span>
    <span class="wms-pagination__size">
      每页
      <el-select
        :model-value="safePageSize"
        size="small"
        :disabled="disabled"
        @change="handlePageSizeChange"
      >
        <el-option v-for="item in pageSizeOptions" :key="item" :label="String(item)" :value="item" />
      </el-select>
      条
    </span>
    <el-button size="small" :disabled="disabled || safeCurrentPage <= 1" @click="changePage(safeCurrentPage - 1)">上一页</el-button>
    <el-button size="small" :disabled="disabled || safeCurrentPage >= pageCount" @click="changePage(safeCurrentPage + 1)">下一页</el-button>
    <span class="wms-pagination__jump">
      跳至
      <el-input-number
        v-model="jumpPage"
        size="small"
        :min="1"
        :max="pageCount"
        :disabled="disabled"
        controls-position="right"
        @change="handleJumpChange"
      />
      页
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  currentPage?: number
  pageSize?: number
  pageSizeOptions?: number[]
  total: number
  pages?: number
  disabled?: boolean
}>(), {
  currentPage: 1,
  pageSize: 10,
  pageSizeOptions: () => [5, 10, 20],
  pages: 0,
  disabled: false
})

const emit = defineEmits<{
  currentChange: [pageNo: number]
  pageSizeChange: [pageSize: number]
}>()

const safeCurrentPage = computed(() => Math.max(props.currentPage || 1, 1))
const safePageSize = computed(() => Math.max(props.pageSize || 10, 1))

const pageCount = computed(() => {
  if (props.pages && props.pages > 0) {
    return props.pages
  }
  return Math.max(Math.ceil(props.total / safePageSize.value), 1)
})

const jumpPage = ref(safeCurrentPage.value)

watch(safeCurrentPage, (pageNo) => {
  jumpPage.value = pageNo
})

function normalizePage(pageNo: number | undefined): number {
  const value = Number(pageNo) || 1
  return Math.min(Math.max(value, 1), pageCount.value)
}

function changePage(pageNo: number | undefined): void {
  const nextPage = normalizePage(pageNo)
  jumpPage.value = nextPage
  if (nextPage !== safeCurrentPage.value) {
    emit('currentChange', nextPage)
  }
}

function handleJumpChange(value: number | undefined): void {
  changePage(value)
}

function handlePageSizeChange(value: number): void {
  if (value !== safePageSize.value) {
    emit('pageSizeChange', value)
  }
}
</script>

<style scoped>
.wms-pagination {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--af-text-2);
  font-size: 13px;
}

.wms-pagination__text,
.wms-pagination__size,
.wms-pagination__jump {
  white-space: nowrap;
}

.wms-pagination__size,
.wms-pagination__jump {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.wms-pagination__size :deep(.el-select) {
  width: 82px;
}

.wms-pagination__jump :deep(.el-input-number) {
  width: 96px;
}

.wms-pagination :deep(.el-button) {
  border-radius: 8px;
}

.wms-pagination :deep(.el-input__wrapper),
.wms-pagination :deep(.el-select__wrapper) {
  border-radius: 8px;
}
</style>
