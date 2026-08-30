# 高速公路抛洒物感知预警大屏

一个面向演示场景的高速公路抛洒物零样本感知与协同预警可视化页面。页面展示路侧 RSU、车载 OBU、路网风险态势、协同预警指标和事件处置追踪。

- 在线演示：https://gitcaka.github.io/highway-debris-detection-dashboard/
- GitHub 仓库：https://github.com/gitcaka/highway-debris-detection-dashboard

> 当前数据均为前端模拟数据，不连接真实检测模型、摄像头或业务接口。页面右下角已标注“演示环境”。

## 页面结构

- 路侧 RSU：两路检测/风险场画面，展示目标、置信度与处置优先级。
- 协同概况：在线节点、预警生成、车辆避险三项核心指标。
- 路网态势：本地路网示意与 ECharts 风险点，不依赖第三方地图密钥或地图瓦片。
- 车载 OBU：两路车端检测画面。
- 事件追踪：风险等级、处置状态和事件到车端画面的联动。
- 趋势排行：24 小时预警触达/时延趋势与风险频发路段排行。

## 目录

```text
.
├─ index.html                 页面语义结构
├─ static/
│  ├─ css/dashboard.css      主题、三栏大屏与移动端响应式样式
│  ├─ js/dashboard.js        模拟数据、图表和联动逻辑
│  └─ img/                   检测演示素材
└─ README.md
```

## 运行

页面可直接打开 `index.html`。为了获得和部署环境一致的资源加载行为，建议在当前目录启动任意静态服务器，例如：

```powershell
npx http-server . -p 8766
```

然后访问 `http://127.0.0.1:8766/`。

页面仅从 CDN 加载 ECharts；图像、样式、脚本和路网底图都在本地。若 ECharts CDN 暂不可用，页面仍会显示摄像头、指标、事件列表和本地路网示意，并给出图表降级提示。

## 交互

- 点击路网风险点：联动左侧路侧画面并更新事件摘要。
- 点击事件表行：联动右侧车端画面并更新检测框、目标和风险等级。
- 悬停或聚焦事件列表：自动暂停滚动。
- 点击“暂停滚动”：手动切换事件列表滚动状态。
- 点击任一摄像头画面：显示当前通道状态提示。

## 数据接入位置

演示数据集中在 `static/js/dashboard.js`：

- `riskNodes`：路网风险点。
- `eventData`：风险事件列表。
- `createLineChart()`：预警触达与通信时延。
- `createBarChart()`：频发路段排行。
- `animateMetrics()`：在线节点模拟波动。

接入真实后端时，建议用接口返回值替换以上静态数组和模拟定时器，并保留现有的 `updateMapFocus()`、`updateCamera()` 和 `renderEvents()` 作为视图更新入口。
