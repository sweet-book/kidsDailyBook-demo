/**
 * 알림장 책 생성 로직 — 파라미터 빌더, entries 구성, API 호출
 */

// ── 이미지 파라미터 빈 값 제거 ──
const IMAGE_PARAM_KEYS = new Set([
    'coverPhoto', 'monthCharacter', 'lineVertical',
    'parentBalloon', 'weatherIcon', 'photo',
]);

function stripEmptyImages(obj) {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
        if (IMAGE_PARAM_KEYS.has(k) && (!v || v === '')) continue;
        result[k] = v;
    }
    return result;
}

// ── API 호출 (SDK 사용) ──
async function sdkPostContent(client, bookUid, templateUid, parameters, breakBefore) {
    return client.contents.insert(bookUid, templateUid, stripEmptyImages(parameters), {
        breakBefore: breakBefore === 'none' ? '' : breakBefore,
    });
}

function getDayOfWeek(dateStr) { return DAY_NAMES[new Date(dateStr).getDay()]; }

// ── 파라미터 빌더 ──
function ganjiParamsA(year, month, mc) {
    return { year: String(year), monthName: mc.name, monthNum: String(month).padStart(2,'0'), monthColor: mc.color };
}

function naejiParamsA(year, month, mc, dayData, bookTitle) {
    // 날짜 글자수 기반 요일 x좌표 계산: "6일"(2글자)→76, "13일"(3글자)→88
    const dayOfWeekX = dayData.date.length <= 2 ? 76.0 : 88.0;
    const p = {
        year: String(year), month: String(month), monthNum: String(month).padStart(2,'0'),
        monthNameCapitalized: mc.cap, monthColor: mc.color,
        bookTitle: bookTitle || '성장 스토리북',
        lineVertical: GRAPHICS_A[mc.lineKey],
        date: dayData.date, dayOfWeek: dayData.dayOfWeek, dayOfWeekX: dayOfWeekX,
        weather: dayData.weather||'', meal: dayData.meal||'', nap: dayData.nap||'',
        hasParentComment: !!dayData.parentComment, hasTeacherComment: !!dayData.teacherComment,
        photos: dayData.photos||[],
    };
    if (dayData.parentComment) p.parentComment = dayData.parentComment;
    if (dayData.teacherComment) p.teacherComment = dayData.teacherComment;
    return p;
}

// ── 알림장B 날씨/식사/낮잠 x좌표 계산 (오른쪽 정렬: 오른쪽 끝에서 역순 배치) ──
function calcInfoPositionsB(weather, meal, nap) {
    const charW = 9;        // 글자당 폭 (fontSize 12 기준)
    const labelW = 22;      // "날씨","식사","낮잠" 라벨 2글자 폭
    const labelGap = 4;     // 라벨과 값 사이 간격
    const itemGap = 14;     // 항목 사이 간격
    let x = 400;            // 오른쪽 끝
    // 낮잠
    const napW = (nap||'').length * charW;
    x -= napW;              const napValueX = x;
    x -= labelGap;
    x -= labelW;            const napLabelX = x;
    x -= itemGap;
    // 식사
    const mealW = (meal||'').length * charW;
    x -= mealW;             const mealValueX = x;
    x -= labelGap;
    x -= labelW;            const mealLabelX = x;
    x -= itemGap;
    // 날씨
    const weatherW = (weather||'').length * charW;
    x -= weatherW;          const weatherValueX = x;
    x -= labelGap;
    x -= labelW;            const weatherLabelX = x;
    return { weatherLabelX, weatherValueX, mealLabelX, mealValueX, napLabelX, napValueX };
}

function ganjiParamsB(year, month, mc) {
    return {
        year: String(year), monthName: mc.name, monthNum: String(month),
        monthCharacter: GRAPHICS_B[mc.characterKey], bgColor: mc.bgColor, textColor: mc.textColor,
    };
}

function naejiParamsB(year, month, mc, dayData, bookTitle) {
    const p = {
        year: String(year), month: String(month), monthNameCapitalized: mc.name,
        bookTitle: bookTitle || '성장 이야기',
        pointColor: mc.textColor,
        date: dayData.dateB||dayData.date, weather: dayData.weather||'', meal: dayData.meal||'', nap: dayData.nap||'',
        ...calcInfoPositionsB(dayData.weather, dayData.meal, dayData.nap),
        hasParentComment: !!dayData.parentComment, hasTeacherComment: !!dayData.teacherComment,
        photos: dayData.photos||[],
    };
    if (dayData.parentComment) p.parentComment = dayData.parentComment;
    if (dayData.teacherComment) p.teacherComment = dayData.teacherComment;
    return p;
}

let chapterCounterC = 0;

function ganjiParamsC(year, month, mc) {
    chapterCounterC++;
    return {
        year: String(year), monthName: mc.NAME, monthNum: String(month).padStart(2,'0'),
        chapterNum: String(chapterCounterC), bgColor: mc.color,
    };
}

function naejiParamsC(year, month, mc, dayData, isFirstOfMonth, bookTitle) {
    const p = {
        year: String(year), month: String(month),
        bookTitle: bookTitle || '어린이집 이야기',
        parentBalloon: GRAPHICS_C[mc.balloon]||'',
        pointColor: mc.color, weatherIcon: GRAPHICS_C.w1||'',
        hasParentComment: !!dayData.parentComment, hasTeacherComment: !!dayData.teacherComment,
        date: dayData.dateC||dayData.date,
        photos: dayData.photos||[],
    };
    if (dayData.parentComment) p.parentComment = dayData.parentComment;
    if (dayData.teacherComment) p.teacherComment = dayData.teacherComment;
    if (isFirstOfMonth) p.monthNameCapitalized = mc.NAME;
    return p;
}

// ── 빈내지 파라미터 ──
function blankNaejiParamsA(mc, bookTitleLabel) {
    return { bookTitle: bookTitleLabel, lineVertical: GRAPHICS_A[mc.lineKey] };
}
function blankNaejiParamsB(year, month, bookTitleLabel) {
    return { bookTitle: bookTitleLabel, year: String(year), month: String(month) };
}
function blankNaejiParamsC(year, month, bookTitleLabel) {
    return { bookTitle: bookTitleLabel, year: String(year), month: String(month) };
}

function buildEntries(items) {
    const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
    const entries = []; let prevMonth = -1;
    sorted.forEach((item) => {
        const year = parseInt(item.date.substring(0,4)), month = parseInt(item.date.substring(5,7)), day = parseInt(item.date.substring(8,10));
        const dayOfWeek = getDayOfWeek(item.date);
        const monthKey = year * 100 + month, isNewMonth = (monthKey !== prevMonth);
        if (isNewMonth) { entries.push({ type: 'ganji', year, month }); prevMonth = monthKey; }
        const d = new Date(item.date); const dayNameEn = DAY_NAMES_EN[d.getDay()];
        entries.push({
            type: 'naeji', year, month, isFirstOfMonth: isNewMonth,
            dayData: {
                date: `${day}일`, dateB: `${month}월 ${day}일`, dateC: `${String(day).padStart(2,'0')}｜${dayNameEn}`, dayOfWeek,
                weather: item.weather||'', meal: item.meal||'', nap: item.nap||'',
                parentComment: item.textQ||'', teacherComment: item.textA||'', photos: item.photoUrls||[],
            },
        });
    });
    return entries;
}
