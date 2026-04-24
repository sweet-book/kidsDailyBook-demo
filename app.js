/**
 * 알림장 앱 UI — 이벤트 핸들링, 파일 업로드, 책 생성 실행
 */

// SDK와 API Key는 이 demo의 백엔드(server.js)에만 존재합니다.
// 프론트는 /api/* 로만 통신하고, 백엔드가 Sweetbook SDK를 들고 대리 호출합니다.

let client = null;           // backend-client.js의 fetch 기반 bridge. SDK가 아님.
let currentEnv = 'sandbox';  // 서버에서 주입
let _paused = false;
let _saved = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const info = await fetch('/api/env').then(r => r.json());
        currentEnv = info.env || 'sandbox';
    } catch (e) {
        console.error('환경 조회 실패:', e);
    }
    renderEnvBanner();
    client = window.createBackendClient();
    await loadTemplateUids();
    updateTemplateUids();
    loadGraphics();

    // Tab 자동완성
    document.querySelectorAll('#bookOptions input[type="text"]').forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !input.value.trim()) {
                const def = input.getAttribute('data-default-value') || input.placeholder;
                if (def) { e.preventDefault(); input.value = def; }
            }
        });
    });
});

function renderEnvBanner() {
    const el = document.getElementById('envBanner');
    if (!el) return;
    if (currentEnv === 'live') {
        el.textContent = '운영 환경 — 실제 책이 생성됩니다.';
        el.className = 'env-banner env-banner-live';
    } else {
        el.textContent = '샌드박스 환경 — 테스트 책만 생성됩니다.';
        el.className = 'env-banner env-banner-sandbox';
    }
}

function getClient() {
    if (!client) client = window.createBackendClient();
    return client;
}

// ── 상태 변수 ──
let dataItems = [];

// ── DOM 요소 ──
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileNameEl = document.getElementById('fileName');
const fileSizeEl = document.getElementById('fileSize');
const dataPreview = document.getElementById('dataPreview');
const dataItemsContainer = document.getElementById('dataItems');
const itemCount = document.getElementById('itemCount');
const bookOptions = document.getElementById('bookOptions');
const createBookBtn = document.getElementById('createBookBtn');
const resetBtn = document.getElementById('resetBtn');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const resultMessage = document.getElementById('resultMessage');
const logArea = document.getElementById('logArea');

// ── 타입 변경 시 템플릿 UID 업데이트 ──
function updateTemplateUids() {
    const type = document.querySelector('input[name="alrimType"]:checked').value;
    const uids = TEMPLATE_UIDS[type];
    document.getElementById('tplCover').value = uids.cover;
    document.getElementById('tplGanji').value = uids.ganji;
    document.getElementById('tplNaeji').value = uids.naeji;
    document.getElementById('tplNaejiFirst').value = uids.naejiFirst;
    document.getElementById('tplBlank').value = uids.blank;
    document.getElementById('tplPublish').value = uids.publish;
}
updateTemplateUids();

document.querySelectorAll('input[name="alrimType"]').forEach(radio => {
    radio.addEventListener('change', () => {
        updateTemplateUids();
        // 타입 변경 시 데이터 초기화
        resetUpload();
    });
});

// ── 로그 출력 ──
function appendLog(msg, type = 'info') {
    logArea.style.display = 'block';
    const span = document.createElement('span');
    span.className = 'log-' + type;
    const timestamp = new Date().toLocaleTimeString();
    span.textContent = `[${timestamp}] ${msg}\n`;
    logArea.appendChild(span);
    logArea.scrollTop = logArea.scrollHeight;
}

// ── 업로드 이벤트 ──
uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (file) handleFile(file); });
uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
uploadArea.addEventListener('dragleave', () => { uploadArea.classList.remove('dragover'); });
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault(); uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) handleFile(file);
    else alert('JSON 파일만 업로드 가능합니다.');
});

function handleFile(file) {
    // 파일명에서 알림장 타입 감지 → 선택된 타입과 불일치 시 차단
    const selectedType = document.querySelector('input[name="alrimType"]:checked').value;
    const fileTypeMatch = file.name.match(/알림장([ABC])/);
    if (fileTypeMatch) {
        const fileType = fileTypeMatch[1];
        if (fileType !== selectedType) {
            alert(`알림장${fileType} 데이터를 알림장${selectedType} 섹션에 넣을 수 없습니다.\n알림장${fileType}를 선택하거나 올바른 JSON을 업로드하세요.`);
            resetUpload();
            return;
        }
    }
    fileNameEl.textContent = `📄 ${file.name}`;
    fileSizeEl.textContent = `크기: ${(file.size / 1024).toFixed(2)} KB`;
    fileInfo.classList.add('show');
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result);
            if (!json.entries) throw new Error('entries 필드가 없습니다');
            const items = extractItems(json);
            parseData(items);
            fillFormFromData(json);
        } catch (error) { alert('JSON 오류: ' + error.message); resetUpload(); }
    };
    reader.readAsText(file);
}

function extractItems(data) {
    const items = [];
    for (const entry of data.entries) {
        if (entry.type !== 'naeji') continue;
        const dd = entry.day_data;
        const month = String(entry.month).padStart(2, '0');
        const dayMatch = dd.date.match(/(\d+)\s*일/);
        const dayNum = dayMatch ? dayMatch[1].padStart(2, '0') : dd.date.replace(/[^0-9]/g, '').padStart(2, '0');
        items.push({
            date: `${entry.year}-${month}-${dayNum}`,
            textQ: dd.parentComment || '',
            textA: dd.teacherComment || '',
            weather: dd.weather || '',
            meal: dd.meal || '',
            nap: dd.nap || '',
            photos: (dd.photos || []).map(u => ({ thumbUrl: u })),
        });
    }
    return items;
}

function fillFormFromData(data) {
    const c = data.cover || {};
    const p = data.publish || {};
    const fill = (id, val) => { if (val) document.getElementById(id).value = val; };
    fill('bookTitle', data.title || '');
    fill('bookTitleLabel', data.bookTitleLabel || '');
    fill('coverChildName', c.childName || '');
    fill('coverSchoolName', c.schoolName || '');
    fill('coverVolumeLabel', c.volumeLabel || '');
    fill('coverPeriodText', c.periodText || '');
    fill('publishTitle', p.title || '');
    fill('publishDate', p.publishDate || '');
    fill('publishAuthor', p.author || '');
    fill('publishHashtags', p.hashtags || '');
}

function parseData(jsonArray) {
    dataItems = []; dataItemsContainer.innerHTML = '';
    jsonArray.forEach((item) => {
        const date = item.date;
        const textQ = item.textQ || '';
        const textA = item.textA || '';
        const photoUrls = (item.photos || []).map(p => p.thumbUrl).filter(u => u);
        dataItems.push({ date, textQ, textA, weather: item.weather||'', meal: item.meal||'', nap: item.nap||'', photoUrls });
        const itemDiv = document.createElement('div'); itemDiv.className = 'data-item';
        let html = `<div class="item-date">${date}</div>`;
        if (textQ) html += `<div class="item-text"><strong>부모님:</strong> ${textQ.substring(0, 100)}${textQ.length > 100 ? '...' : ''}</div>`;
        if (textA) html += `<div class="item-text"><strong>선생님:</strong> ${textA.substring(0, 100)}${textA.length > 100 ? '...' : ''}</div>`;
        if (photoUrls.length > 0) {
            html += `<div class="item-photo">`;
            photoUrls.forEach((url, idx) => { html += `<img src="${url}" alt="사진 ${idx+1}" style="max-width:80px;margin-right:4px;" />`; });
            html += `<span>사진 ${photoUrls.length}장</span></div>`;
        }
        itemDiv.innerHTML = html; dataItemsContainer.appendChild(itemDiv);
    });
    itemCount.textContent = `${dataItems.length}개 항목`;
    dataPreview.classList.add('show'); bookOptions.classList.add('show'); createBookBtn.disabled = false;
    autoFillFromData();
}

function autoFillFromData() {
    if (dataItems.length === 0) return;
    const dates = dataItems.map(item => item.date).sort();
    const firstDate = dates[0], lastDate = dates[dates.length - 1];
    const fy = parseInt(firstDate.substring(0,4)), fm = parseInt(firstDate.substring(5,7));
    const ly = parseInt(lastDate.substring(0,4)), lm = parseInt(lastDate.substring(5,7));
    const today = new Date();

    const fill = (id, val) => { const el = document.getElementById(id); if (!el.value) el.value = val; };
    fill('coverPeriodText', `${fy}년 ${fm}월~${ly}년 ${lm}월`);
    fill('coverVolumeLabel', `Vol.1`);
    fill('publishDate', `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`);
    fill('publishHashtags', '#포토북은 #역시 #스위트북');
    fill('bookTitle', `알림장 ${fy}.${String(fm).padStart(2,'0')}~${ly}.${String(lm).padStart(2,'0')}`);
    fill('publishTitle', document.getElementById('bookTitle').value);
}

// ── 버튼 상태 관리 ──
function setButtons(state) {
    const show = (el, v) => el.style.display = v ? 'inline-block' : 'none';
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    createBookBtn.disabled = state !== 'idle';
    show(pauseBtn, state === 'running');
    show(resumeBtn, state === 'paused' || state === 'stopped');
    resetBtn.disabled = state === 'running';
}

// ── entries 순차 처리 (일시중지/이어서하기 지원) ──
async function processEntries(ctx) {
    let { startIndex, successCount, failCount, lastResult } = ctx;
    const { bookUid, entries, tplUids, alrimType, monthConfig, bookTitleLabel, coverPhoto, bookTitle, startTime } = ctx;
    const totalEntries = entries.length;

    for (let i = startIndex; i < entries.length; i++) {
        if (_paused) {
            _saved = { ...ctx, startIndex: i, successCount, failCount, lastResult };
            appendLog(`일시중지 (${i}/${totalEntries})`, 'info');
            loading.classList.remove('show');
            setButtons('paused');
            return;
        }
        const entry = entries[i]; const mc = monthConfig[entry.month] || monthConfig[1];
        try {
            if (entry.type === 'ganji') {
                loadingText.textContent = `${entry.month}월 간지 생성 중... (${i+1}/${totalEntries})`; appendLog(`${entry.month}월 간지 생성 중...`, 'info');
                let ganjiP;
                if (alrimType === 'A') ganjiP = ganjiParamsA(entry.year, entry.month, mc);
                else if (alrimType === 'B') ganjiP = ganjiParamsB(entry.year, entry.month, mc);
                else ganjiP = ganjiParamsC(entry.year, entry.month, mc);
                lastResult = await sdkPostContent(client, bookUid, tplUids.ganji, ganjiP, 'page');
                appendLog(`${entry.month}월 간지 완료`, 'success'); successCount++;
            } else if (entry.type === 'naeji') {
                const tplKey = entry.isFirstOfMonth ? tplUids.naejiFirst : tplUids.naeji;
                const breakBefore = entry.isFirstOfMonth ? 'page' : 'none';
                loadingText.textContent = `${entry.month}월 ${entry.dayData.date} 내지 생성 중... (${i+1}/${totalEntries})`;
                appendLog(`${entry.month}월 ${entry.dayData.date} 내지 (${entry.isFirstOfMonth ? '월시작' : '일반'}) 생성 중...`, 'info');
                let naejiP;
                if (alrimType === 'A') naejiP = naejiParamsA(entry.year, entry.month, mc, entry.dayData, bookTitleLabel);
                else if (alrimType === 'B') naejiP = naejiParamsB(entry.year, entry.month, mc, entry.dayData, bookTitleLabel);
                else naejiP = naejiParamsC(entry.year, entry.month, mc, entry.dayData, entry.isFirstOfMonth, bookTitleLabel);
                lastResult = await sdkPostContent(client, bookUid, tplKey, naejiP, breakBefore);
                appendLog(`${entry.month}월 ${entry.dayData.date} 내지 완료`, 'success'); successCount++;
            }
        } catch (err) {
            const detail = err.details ? ` | ${JSON.stringify(err.details)}` : '';
            appendLog(`${entry.month}월 ${entry.type} 오류: ${err.message}${detail}`, 'error');
            failCount++;
            _saved = { ...ctx, startIndex: i, successCount, failCount, lastResult };
            appendLog('"이어서하기"로 재시도 가능', 'info');
            loading.classList.remove('show');
            setButtons('stopped');
            return;
        }
    }

    // 마지막 내지가 left면 빈내지 삽입
    const lastSide = lastResult?.pageSide || 'right';
    if (lastSide === 'left' && tplUids.blank) {
        appendLog('빈내지 삽입 (발행면 위치 조정)...', 'info');
        const lastEntry = entries[entries.length - 1];
        const lastMonth = lastEntry?.month || 1;
        const lastYear = lastEntry?.year || new Date().getFullYear();
        const lastMc = monthConfig[lastMonth] || monthConfig[1];
        let blankP;
        if (alrimType === 'A') blankP = blankNaejiParamsA(lastMc, bookTitleLabel);
        else if (alrimType === 'B') blankP = blankNaejiParamsB(lastYear, lastMonth, bookTitleLabel);
        else blankP = blankNaejiParamsC(lastYear, lastMonth, bookTitleLabel);
        await sdkPostContent(client, bookUid, tplUids.blank, blankP, 'page');
        appendLog('빈내지 삽입 완료', 'success');
    }

    // 발행면
    loadingText.textContent = '발행면 생성 중...'; appendLog('발행면 생성 중...', 'info');
    const publishParams = { photo: coverPhoto||'', title: document.getElementById('publishTitle').value.trim()||bookTitle,
        publishDate: document.getElementById('publishDate').value.trim()||'', author: document.getElementById('publishAuthor').value.trim()||'',
        hashtags: document.getElementById('publishHashtags').value.trim()||'' };
    const publishResult = await sdkPostContent(client, bookUid, tplUids.publish, publishParams, 'page');
    appendLog('발행면 완료', 'success');

    const totalPages = publishResult?.pageCount || 0;
    const totalTime = Date.now() - startTime;
    appendLog(`책 생성 완료! bookUid: ${bookUid}, 총 ${totalPages}페이지, 소요시간: ${(totalTime/1000).toFixed(2)}초`, 'success');
    loading.classList.remove('show');
    resultMessage.innerHTML = `✓ 알림장${alrimType} 책이 생성되었습니다! (최종화 전)<br><small>bookUid: ${bookUid}</small><br><small>총 ${totalPages}페이지 | 전체: ${totalEntries}개 | 성공: ${successCount}개 | 실패: ${failCount}개</small><br><small>생성 시간: ${(totalTime/1000).toFixed(2)}초</small>`;
    resultMessage.className = 'result-message success show';

    const finalizeBtn = document.getElementById('finalizeBtn');
    finalizeBtn.dataset.bookUid = bookUid;
    finalizeBtn.disabled = totalPages < 24;
    finalizeBtn.style.display = 'inline-block';

    _saved = null;
    setButtons('done');
}

// ── 이어서하기 ──
async function resumeBook() {
    if (!_saved) return;
    _paused = false;
    loading.classList.add('show');
    setButtons('running');
    await processEntries(_saved);
}

// ── 책 생성 메인 로직 ──
async function createAlrimjangBook() {
    const bookTitle = document.getElementById('bookTitle').value.trim();
    const bookTitleLabel = document.getElementById('bookTitleLabel').value.trim() || bookTitle;
    const alrimType = document.querySelector('input[name="alrimType"]:checked').value;
    if (!bookTitle) { alert('책 제목을 입력하세요.'); return; }
    if (!getClient()) return;
    const tplUids = {
        cover: document.getElementById('tplCover').value.trim(), ganji: document.getElementById('tplGanji').value.trim(),
        naeji: document.getElementById('tplNaeji').value.trim(), naejiFirst: document.getElementById('tplNaejiFirst').value.trim(),
        blank: document.getElementById('tplBlank').value.trim(), publish: document.getElementById('tplPublish').value.trim(),
    };
    if (!tplUids.cover || !tplUids.ganji || !tplUids.naeji || !tplUids.naejiFirst || !tplUids.publish) { alert('모든 템플릿 UID를 입력하세요.'); return; }
    const monthConfig = alrimType === 'A' ? MONTH_CONFIG_A : alrimType === 'B' ? MONTH_CONFIG_B : MONTH_CONFIG_C;
    chapterCounterC = 0;
    _paused = false;
    _saved = null;
    setButtons('running');
    loading.classList.add('show'); resultMessage.classList.remove('show');
    logArea.innerHTML = ''; logArea.style.display = 'block';
    const startTime = Date.now();
    try {
        appendLog(`알림장${alrimType} 책 생성 시작...`, 'info'); appendLog(`API: ${currentEnv} (backend: /api/*)`, 'info');
        const createResult = await client.books.create({ title: bookTitle, bookSpecUid: 'SQUAREBOOK_HC', creationType: 'TEMPLATE' });
        const bookUid = createResult.bookUid || createResult.uid;
        appendLog(`책 생성 완료: ${bookUid}`, 'success');

        // 표지
        loadingText.textContent = '표지를 생성하는 중...'; appendLog('표지 생성 중...', 'info');
        let coverPhoto = '';
        for (let i = 0; i < dataItems.length; i++) { if (dataItems[i].photoUrls?.length > 0) { coverPhoto = dataItems[i].photoUrls[0]; break; } }
        const coverParams = {
            childName: document.getElementById('coverChildName').value.trim()||'',
            schoolName: document.getElementById('coverSchoolName').value.trim()||'',
            volumeLabel: document.getElementById('coverVolumeLabel').value.trim()||'',
            periodText: document.getElementById('coverPeriodText').value.trim()||'',
            coverPhoto,
        };
        const cleanCoverParams = stripEmptyImages(coverParams);
        appendLog('표지 파라미터: ' + JSON.stringify(cleanCoverParams), 'info');
        await client.covers.create(bookUid, tplUids.cover, cleanCoverParams);
        appendLog('표지 생성 완료', 'success');

        const entries = buildEntries(dataItems);

        const MAX_PAGES = 130;
        let estPages = 4;
        for (const e of entries) { estPages += 1; }
        appendLog(`예상 페이지 수: ${estPages}페이지 (최대 ${MAX_PAGES})`, estPages > MAX_PAGES ? 'error' : 'info');
        if (estPages > MAX_PAGES) {
            const over = estPages - MAX_PAGES;
            alert(`예상 페이지(${estPages})가 최대 ${MAX_PAGES}페이지를 초과합니다.\n${over}페이지를 줄여주세요.`);
            loading.classList.remove('show');
            setButtons('idle');
            return;
        }

        const ctx = { bookUid, entries, tplUids, alrimType, monthConfig, bookTitleLabel, coverPhoto, bookTitle, startTime,
                      startIndex: 0, successCount: 0, failCount: 0, lastResult: null };
        await processEntries(ctx);

    } catch (error) {
        appendLog(`오류: ${error.message}`, 'error'); loading.classList.remove('show');
        resultMessage.textContent = '✗ 책 생성 중 오류가 발생했습니다: ' + error.message;
        resultMessage.className = 'result-message error show';
        setButtons('idle');
    }
}

createBookBtn.addEventListener('click', createAlrimjangBook);
document.getElementById('pauseBtn').addEventListener('click', () => { _paused = true; });
document.getElementById('resumeBtn').addEventListener('click', resumeBook);
resetBtn.addEventListener('click', () => { if (confirm('모든 내용을 초기화하시겠습니까?')) resetUpload(); });

// 제작(최종화) 버튼
document.getElementById('finalizeBtn').addEventListener('click', async () => {
    const finalizeBtn = document.getElementById('finalizeBtn');
    const bookUid = finalizeBtn.dataset.bookUid;
    if (!bookUid) return;
    finalizeBtn.disabled = true;
    appendLog('최종화 중...', 'info');
    try {
        await client.books.finalize(bookUid);
        appendLog(`최종화 완료! bookUid: ${bookUid}`, 'success');
        resultMessage.innerHTML = resultMessage.innerHTML.replace('(최종화 전)', '(최종화 완료)');
        finalizeBtn.style.display = 'none';
    } catch (error) {
        appendLog(`최종화 오류: ${error.message}`, 'error');
        finalizeBtn.disabled = false;
    }
});

function resetUpload() {
    _paused = false;
    _saved = null;
    fileInput.value = ''; fileInfo.classList.remove('show'); dataPreview.classList.remove('show');
    bookOptions.classList.remove('show'); loading.classList.remove('show'); resultMessage.classList.remove('show');
    logArea.style.display = 'none'; logArea.innerHTML = ''; dataItems = [];
    document.getElementById('bookTitle').value = '';
    document.getElementById('bookTitleLabel').value = '';
    createBookBtn.disabled = true;
    setButtons('idle');
    const finalizeBtn = document.getElementById('finalizeBtn');
    finalizeBtn.style.display = 'none';
    finalizeBtn.dataset.bookUid = '';
}
