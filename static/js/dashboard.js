(() => {
    'use strict';

    const riskMeta = {
        high: { label: '高风险', color: '#ff5a66', cameraClass: 'high' },
        medium: { label: '中风险', color: '#ffad42', cameraClass: 'medium' },
        low: { label: '低风险', color: '#49a5ff', cameraClass: 'low' }
    };

    const riskNodes = [
        { name: '盘龙立交', location: '盘龙立交 K12+480', plot: [58, 56], size: 18, object: '木箱', risk: 'high', confidence: 92.4, source: 'RSU-01' },
        { name: '西环立交', location: '西环立交 K5+210', plot: [30, 42], size: 16, object: '铁块', risk: 'high', confidence: 94.8, source: 'RSU-04' },
        { name: '二郎段', location: '二郎段 K8+950', plot: [48, 34], size: 13, object: '碎石', risk: 'medium', confidence: 88.6, source: 'OBU-0417' },
        { name: '大公馆', location: '大公馆 K3+620', plot: [67, 70], size: 11, object: '纸箱', risk: 'low', confidence: 87.3, source: 'OBU-0312' }
    ];

    const eventData = [
        { time: '21:32', source: '渝A·8T*', location: '盘龙段', object: '木箱', risk: 'high', state: 'pending', stateLabel: '待处置' },
        { time: '21:28', source: 'RSU-04', location: '西环立交', object: '铁块', risk: 'high', state: 'processing', stateLabel: '处置中' },
        { time: '21:15', source: '川A·B3*', location: '二郎段', object: '碎石', risk: 'medium', state: 'processing', stateLabel: '跟进中' },
        { time: '21:02', source: '渝C·55*', location: '大公馆', object: '纸箱', risk: 'low', state: 'closed', stateLabel: '已闭环' },
        { time: '20:45', source: 'RSU-12', location: '石桥铺', object: '塑料瓶', risk: 'low', state: 'closed', stateLabel: '已闭环' },
        { time: '20:30', source: '贵A·34*', location: '北碚段', object: '轮胎碎片', risk: 'medium', state: 'closed', stateLabel: '已闭环' }
    ];

    const $ = (selector, parent = document) => parent.querySelector(selector);
    const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
    const byId = id => document.getElementById(id);

    function formatDate(date) {
        const pad = number => String(number).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    function updateClock() {
        const now = new Date();
        const clock = byId('sysTime');
        const formatted = formatDate(now);
        clock.textContent = formatted;
        clock.dateTime = now.toISOString();
        byId('lastUpdate').textContent = formatted.slice(-8);
    }

    function renderEvents() {
        const body = $('#eventTable tbody');
        const rows = eventData.map((event, index) => {
            const risk = riskMeta[event.risk];
            return `
                <tr data-event-index="${index}" tabindex="0" aria-label="${event.location}${event.object}，${risk.label}，${event.stateLabel}">
                    <td>${event.time}</td>
                    <td class="source">${event.source}</td>
                    <td class="location-object"><strong>${event.location}</strong><small>${event.object}</small></td>
                    <td><span class="risk-badge ${event.risk}">${risk.label}</span></td>
                    <td><span class="state-badge ${event.state}">${event.stateLabel}</span></td>
                </tr>`;
        }).join('');
        body.innerHTML = rows + rows;
        byId('unhandledCount').textContent = eventData.filter(item => item.state === 'pending' || item.state === 'processing').length;
    }

    let toastTimer;
    function showToast(message) {
        const toast = byId('linkageToast');
        toast.textContent = message;
        toast.classList.add('show');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
    }

    function updateCamera(cameraId, event) {
        const camera = byId(cameraId);
        const box = byId(`${cameraId.replace('cam', 'c')}-box`);
        const prefix = cameraId.replace('cam', 'c');
        const risk = riskMeta[event.risk];
        const confidence = event.confidence || Math.min(98.8, 85 + Math.random() * 11);
        const positions = [
            { x: 42, y: 43, w: 16, h: 21 },
            { x: 51, y: 39, w: 18, h: 25 },
            { x: 34, y: 48, w: 14, h: 19 },
            { x: 57, y: 46, w: 15, h: 22 }
        ];
        const position = positions[Math.floor(Math.random() * positions.length)];

        camera.classList.remove('flash');
        void camera.offsetWidth;
        camera.classList.add('flash');
        box.className = `detection-box ${risk.cameraClass}`;
        box.style.setProperty('--box-x', `${position.x}%`);
        box.style.setProperty('--box-y', `${position.y}%`);
        box.style.setProperty('--box-w', `${position.w}%`);
        box.style.setProperty('--box-h', `${position.h}%`);

        byId(`${prefix}-obj`).textContent = event.object;
        byId(`${prefix}-conf`).textContent = `${confidence.toFixed(1)}%`;
        const riskElement = byId(`${prefix}-risk`);
        riskElement.textContent = risk.label;
        riskElement.className = `risk-text ${risk.cameraClass}`;
        byId(`${prefix}-label`).textContent = `${event.object} ${confidence.toFixed(1)}%`;

        if (event.source) {
            const cameraTitle = $('.camera-topline > span:first-child', camera);
            if (cameraId === 'cam1') cameraTitle.innerHTML = `<i class="live-dot"></i>${event.source} · ${event.location}`;
            if (cameraId === 'cam2') cameraTitle.innerHTML = `<i class="live-dot"></i>${event.source} · 协同事件回放`;
        }
    }

    function updateMapFocus(node) {
        const risk = riskMeta[node.risk];
        const card = byId('mapFocusCard');
        const focusRisk = $('.focus-risk', card);
        card.classList.add('updating');
        window.setTimeout(() => card.classList.remove('updating'), 260);
        focusRisk.className = `focus-risk ${node.risk}`;
        $('span', focusRisk).textContent = risk.label === '高风险' ? '当前高风险事件' : `${risk.label}事件`;
        byId('focusLocation').textContent = node.location;
        byId('focusObject').textContent = node.object;
        byId('focusConfidence').textContent = `置信度 ${node.confidence.toFixed(1)}%`;
        byId('focusSource').textContent = node.source;
        updateCamera('cam1', node);
        showToast(`已联动 ${node.source}：${node.location} · ${node.object}`);
    }

    function bindEventInteractions() {
        const table = byId('eventTable');
        const activateRow = row => {
            if (!row) return;
            const event = eventData[Number(row.dataset.eventIndex)];
            $$('.event-body tr').forEach(item => item.classList.toggle('selected', item.dataset.eventIndex === row.dataset.eventIndex));
            updateCamera('cam2', event);
            showToast(`已联动车载画面：${event.location} · ${event.object}`);
        };
        table.addEventListener('click', event => activateRow(event.target.closest('tr[data-event-index]')));
        table.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                activateRow(event.target.closest('tr[data-event-index]'));
            }
        });

        const scrollArea = byId('eventScroll');
        const pauseButton = byId('pauseScroll');
        let manualPause = false;
        let interactionPause = false;
        let lastFrame = performance.now();

        const autoScroll = now => {
            const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (!manualPause && !interactionPause && !reduceMotion && document.visibilityState === 'visible') {
                scrollArea.scrollTop += Math.min(0.45, (now - lastFrame) * 0.018);
                const resetPoint = scrollArea.scrollHeight / 2;
                if (resetPoint > 0 && scrollArea.scrollTop >= resetPoint) scrollArea.scrollTop -= resetPoint;
            }
            lastFrame = now;
            window.requestAnimationFrame(autoScroll);
        };
        scrollArea.addEventListener('mouseenter', () => { interactionPause = true; });
        scrollArea.addEventListener('mouseleave', () => { interactionPause = false; });
        scrollArea.addEventListener('focusin', () => { interactionPause = true; });
        scrollArea.addEventListener('focusout', () => { interactionPause = false; });
        window.requestAnimationFrame(autoScroll);

        pauseButton.addEventListener('click', () => {
            manualPause = !manualPause;
            scrollArea.classList.toggle('is-paused', manualPause);
            pauseButton.textContent = manualPause ? '继续滚动' : '暂停滚动';
            pauseButton.setAttribute('aria-pressed', String(manualPause));
        });

        $$('.camera-view').forEach(camera => camera.addEventListener('click', () => {
            camera.classList.remove('flash');
            void camera.offsetWidth;
            camera.classList.add('flash');
            showToast(`${$('.camera-topline span', camera).textContent.trim()} · 画面状态正常`);
        }));
    }

    function createLineChart() {
        const container = byId('lineChart');
        container.innerHTML = '';
        const chart = echarts.init(container);
        chart.setOption({
            animationDuration: 700,
            color: ['#37d5ff', '#25d6a2'],
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(5, 18, 33, 0.96)',
                borderColor: 'rgba(55, 213, 255, 0.4)',
                textStyle: { color: '#eaf8ff', fontSize: 10 },
                axisPointer: { lineStyle: { color: 'rgba(55, 213, 255, 0.35)' } }
            },
            legend: { top: 5, right: 7, itemWidth: 11, itemHeight: 5, textStyle: { color: '#7897ad', fontSize: 8 } },
            grid: { left: 38, right: 37, top: 30, bottom: 22 },
            xAxis: {
                type: 'category', boundaryGap: false,
                data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
                axisLine: { lineStyle: { color: 'rgba(93, 158, 188, 0.18)' } },
                axisTick: { show: false },
                axisLabel: { color: '#5f7e94', fontSize: 8, margin: 8 }
            },
            yAxis: [
                { type: 'value', name: '次', nameTextStyle: { color: '#52718d', fontSize: 8 }, splitNumber: 3, axisLabel: { color: '#5f7e94', fontSize: 8 }, splitLine: { lineStyle: { color: 'rgba(90, 178, 220, 0.08)', type: 'dashed' } } },
                { type: 'value', name: 'ms', nameTextStyle: { color: '#52718d', fontSize: 8 }, splitNumber: 3, axisLabel: { color: '#5f7e94', fontSize: 8 }, splitLine: { show: false } }
            ],
            series: [
                {
                    name: '预警触达', type: 'line', smooth: 0.35, symbol: 'circle', symbolSize: 4,
                    lineStyle: { width: 2 },
                    areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(55,213,255,0.28)' }, { offset: 1, color: 'rgba(55,213,255,0)' }]) },
                    data: [120, 72, 386, 542, 468, 750, 612]
                },
                { name: '通信时延', type: 'line', yAxisIndex: 1, smooth: 0.35, symbol: 'none', lineStyle: { width: 1.5, type: 'dashed' }, data: [15, 12, 24, 28, 21, 33, 18] }
            ]
        });
        return chart;
    }

    function createBarChart() {
        const container = byId('barChart');
        container.innerHTML = '';
        const chart = echarts.init(container);
        chart.setOption({
            animationDuration: 700,
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                backgroundColor: 'rgba(5, 18, 33, 0.96)', borderColor: 'rgba(55, 213, 255, 0.4)',
                textStyle: { color: '#eaf8ff', fontSize: 10 }
            },
            grid: { left: 35, right: 10, top: 20, bottom: 27 },
            xAxis: {
                type: 'category', data: ['盘龙段', '二郎段', '西环', '大公馆', '石桥铺'],
                axisTick: { show: false }, axisLine: { lineStyle: { color: 'rgba(93, 158, 188, 0.18)' } },
                axisLabel: { color: '#6e8da3', fontSize: 8, interval: 0 }
            },
            yAxis: {
                type: 'value', splitNumber: 3,
                axisLabel: { color: '#5f7e94', fontSize: 8 },
                splitLine: { lineStyle: { color: 'rgba(90, 178, 220, 0.08)', type: 'dashed' } }
            },
            series: [{
                type: 'bar', barMaxWidth: 22,
                itemStyle: {
                    borderRadius: [3, 3, 0, 0],
                    color: params => {
                        const colors = ['#ff5a66', '#ff8c55', '#ffad42', '#49a5ff', '#3e7fd7'];
                        return new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: colors[params.dataIndex] }, { offset: 1, color: `${colors[params.dataIndex]}22` }]);
                    }
                },
                label: { show: true, position: 'top', color: '#a9c2d2', fontSize: 8 },
                data: [110, 85, 60, 40, 25]
            }]
        });
        return chart;
    }

    function createMapChart() {
        const container = byId('networkMap');
        const fallback = byId('mapFallback');
        const chart = echarts.init(container);

        try {
            chart.setOption({
                tooltip: {
                    trigger: 'item',
                    formatter: params => {
                        const node = params.data.customData;
                        return `<b>${node.location}</b><br>${node.object} · ${riskMeta[node.risk].label}<br>置信度 ${node.confidence.toFixed(1)}%`;
                    },
                    backgroundColor: 'rgba(5, 18, 33, 0.95)', borderColor: 'rgba(55, 213, 255, 0.45)',
                    textStyle: { color: '#eaf8ff', fontSize: 10 }
                },
                grid: { left: 0, right: 0, top: 0, bottom: 0 },
                xAxis: { type: 'value', min: 0, max: 100, show: false },
                yAxis: { type: 'value', min: 0, max: 100, show: false },
                series: [{
                    type: 'effectScatter', coordinateSystem: 'cartesian2d', zlevel: 2,
                    rippleEffect: { period: 2.7, scale: 4.5, brushType: 'stroke' },
                    label: {
                        show: true, position: 'right', formatter: '{b}', color: '#d9eef7', fontSize: 9,
                        backgroundColor: 'rgba(4, 16, 29, 0.82)', borderColor: 'rgba(74, 166, 204, 0.22)', borderWidth: 1, padding: [3, 5], borderRadius: 3
                    },
                    data: riskNodes.map(node => ({
                        name: `${node.name} · ${node.object}`, value: [...node.plot, node.confidence], symbolSize: node.size,
                        itemStyle: { color: riskMeta[node.risk].color, shadowBlur: 14, shadowColor: riskMeta[node.risk].color },
                        customData: node
                    }))
                }]
            });

            chart.on('click', params => {
                if (params.data && params.data.customData) updateMapFocus(params.data.customData);
            });
            fallback.classList.add('charts-ready');
            return chart;
        } catch (error) {
            console.warn('地图服务暂不可用，已切换为路网示意图。', error);
            chart.dispose();
            container.style.pointerEvents = 'none';
            return null;
        }
    }

    function initCharts() {
        if (!window.echarts) {
            $$('.chart-placeholder').forEach(item => {
                item.textContent = '图表服务暂不可用';
                item.classList.add('error');
            });
            return [];
        }

        const charts = [];
        try { charts.push(createLineChart()); } catch (error) { console.warn('趋势图初始化失败。', error); }
        try { charts.push(createBarChart()); } catch (error) { console.warn('排行图初始化失败。', error); }
        try {
            const mapChart = createMapChart();
            if (mapChart) charts.push(mapChart);
        } catch (error) { console.warn('地图初始化失败。', error); }

        let resizeTimer;
        window.addEventListener('resize', () => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => charts.forEach(chart => chart && chart.resize()), 120);
        });
        return charts;
    }

    function bindFallbackMap() {
        $$('.fallback-node').forEach((node, index) => {
            node.style.cursor = 'pointer';
            node.addEventListener('click', () => updateMapFocus(riskNodes[index]));
        });
    }

    function animateMetrics() {
        let baseNodes = 15284;
        window.setInterval(() => {
            baseNodes = Math.max(15270, Math.min(15310, baseNodes + Math.floor(Math.random() * 5) - 2));
            byId('nodeCount').textContent = baseNodes.toLocaleString('zh-CN');
        }, 5000);
    }

    function init() {
        updateClock();
        window.setInterval(updateClock, 1000);
        renderEvents();
        bindEventInteractions();
        bindFallbackMap();
        initCharts();
        animateMetrics();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
