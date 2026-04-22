<template>
    <nav class="wms-nav">
        <RouterLink to="/dashboard" class="nav-item">首页</RouterLink>
        <RouterLink to="/wms/warehouses" class="nav-item">仓库</RouterLink>
        <RouterLink to="/wms/areas" class="nav-item">区域</RouterLink>
        <RouterLink to="/wms/locations" class="nav-item">库位</RouterLink>
        <RouterLink to="/wms/materials" class="nav-item">物料</RouterLink>
        <RouterLink to="/wms/inbound-orders" class="nav-item">入库</RouterLink>
        <RouterLink to="/wms/outbound-orders" class="nav-item">出库</RouterLink>
        <RouterLink to="/wms/stocks" class="nav-item">库存</RouterLink>
    </nav>
</template>

<style scoped>
.wms-nav {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 14px;
}

.nav-item {
    text-decoration: none;
    color: #334155;
    font-size: 13px;
    border: 1px solid #cbd5e1;
    border-radius: 999px;
    padding: 4px 12px;
    background: #fff;
}

.nav-item.router-link-active {
    border-color: #2563eb;
    color: #2563eb;
    background: #eff6ff;
}
</style>
