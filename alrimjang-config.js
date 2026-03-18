/**
 * 알림장 A/B/C 타입별 설정 — 템플릿 UID, 그래픽 키맵, 월별 색상/아이콘 등
 */

const PROJECT_CONFIG = {
    typeRadioName: 'alrimType',
    typeLabel: '알림장',
    typeLabels: { ganji: '간지', naeji: '내지', blank: '빈내지' },
    derivedParams: new Set([
        'monthNum', 'monthName', 'monthNameCapitalized', 'monthColor', 'monthCharacter',
        'bgColor', 'textColor', 'pointColor', 'chapterNum',
        'lineVertical', 'parentBalloon', 'weatherIcon',
        'dayOfWeek', 'dayOfWeekX', 'weatherLabelX', 'weatherValueX', 'mealLabelX', 'mealValueX', 'napLabelX', 'napValueX',
        'hasParentComment', 'hasTeacherComment',
        'bookTitle', 'year', 'month',
    ]),
    onInit: loadGraphics,
};

// ── 템플릿 UID (templates.json에서 로드) ──
const TEMPLATE_UIDS = { A: {}, B: {}, C: {} };

// templateName → 코드키 매핑
const TPL_NAME_MAP = {
    A: { '알림장A_표지':'cover', '알림장A_간지':'ganji', '알림장A_내지':'naeji', '알림장A_내지_월시작':'naejiFirst', '알림장A_빈내지':'blank', '알림장A_발행면':'publish' },
    B: { '알림장B_표지':'cover', '알림장B_간지':'ganji', '알림장B_내지':'naeji', '알림장B_내지_월시작':'naejiFirst', '알림장B_빈내지':'blank', '알림장B_발행면':'publish' },
    C: { '알림장C_표지':'cover', '알림장C_간지':'ganji', '알림장C_내지':'naeji', '알림장C_내지_월시작':'naejiFirst', '알림장C_빈내지':'blank', '알림장C_발행면':'publish' },
};

function parseTemplatesJson(items, nameMap) {
    const result = {};
    for (const item of items) {
        const key = nameMap[item.templateName];
        if (key) result[key] = item.templateUid;
    }
    return result;
}

async function loadTemplateUids() {
    try {
        const [respA, respB, respC] = await Promise.all([
            fetch('알림장A/templates/templates.json'), fetch('알림장B/templates/templates.json'), fetch('알림장C/templates/templates.json'),
        ]);
        if (respA.ok) Object.assign(TEMPLATE_UIDS.A, parseTemplatesJson(await respA.json(), TPL_NAME_MAP.A));
        if (respB.ok) Object.assign(TEMPLATE_UIDS.B, parseTemplatesJson(await respB.json(), TPL_NAME_MAP.B));
        if (respC.ok) Object.assign(TEMPLATE_UIDS.C, parseTemplatesJson(await respC.json(), TPL_NAME_MAP.C));
    } catch (err) { console.warn('templates.json 로드 실패:', err); }
}

// ── 그래픽 리소스 (JSON에서 로드) ──
let GRAPHICS_A = {}, GRAPHICS_B = {}, GRAPHICS_C = {};

function parseGraphicsJson(items) {
    const result = {};
    for (const item of items) {
        result[item.key] = item.serverPath;
    }
    return result;
}

async function loadGraphics() {
    try {
        const [respA, respB, respC] = await Promise.all([
            fetch('알림장A/templates/graphics.json'), fetch('알림장B/templates/graphics.json'), fetch('알림장C/templates/graphics.json'),
        ]);
        if (respA.ok) { GRAPHICS_A = parseGraphicsJson(await respA.json()); }
        if (respB.ok) { GRAPHICS_B = parseGraphicsJson(await respB.json()); }
        if (respC.ok) { GRAPHICS_C = parseGraphicsJson(await respC.json()); }
    } catch (err) { console.warn('graphics.json 로드 실패:', err); }
}

// ── 월별 설정 ──
const MONTH_CONFIG_A = {
    1:  { color: '#FFFFB1C3', lineKey: 'linePink',   name: 'JANUARY',   cap: 'January' },
    2:  { color: '#FF57BCB4', lineKey: 'lineMint',   name: 'FEBRUARY',  cap: 'February' },
    3:  { color: '#FFFFBF77', lineKey: 'lineYellow', name: 'MARCH',     cap: 'March' },
    4:  { color: '#FF7D90C8', lineKey: 'linePurple', name: 'APRIL',     cap: 'April' },
    5:  { color: '#FFFFB1C3', lineKey: 'linePink',   name: 'MAY',       cap: 'May' },
    6:  { color: '#FF7D90C8', lineKey: 'linePurple', name: 'JUNE',      cap: 'June' },
    7:  { color: '#FFFFB1C3', lineKey: 'linePink',   name: 'JULY',      cap: 'July' },
    8:  { color: '#FF57BCB4', lineKey: 'lineMint',   name: 'AUGUST',    cap: 'August' },
    9:  { color: '#FFFFBF77', lineKey: 'lineYellow', name: 'SEPTEMBER', cap: 'September' },
    10: { color: '#FF7D90C8', lineKey: 'linePurple', name: 'OCTOBER',   cap: 'October' },
    11: { color: '#FFFFB1C3', lineKey: 'linePink',   name: 'NOVEMBER',  cap: 'November' },
    12: { color: '#FF7D90C8', lineKey: 'linePurple', name: 'DECEMBER',  cap: 'December' },
};
const MONTH_CONFIG_B = {
    1:  { characterKey: 'm01', name: 'January',   bgColor: '#FFDDECFB', textColor: '#FF7AB4F0' },
    2:  { characterKey: 'm02', name: 'February',  bgColor: '#FFDDECFB', textColor: '#FF7AB4F0' },
    3:  { characterKey: 'm03', name: 'March',     bgColor: '#FFFFE2E4', textColor: '#FFFF8B95' },
    4:  { characterKey: 'm04', name: 'April',     bgColor: '#FFFFE2E4', textColor: '#FFFF8B95' },
    5:  { characterKey: 'm05', name: 'May',       bgColor: '#FFFFE2E4', textColor: '#FFFF8B95' },
    6:  { characterKey: 'm06', name: 'June',      bgColor: '#FFD8F3F3', textColor: '#FF64D0D0' },
    7:  { characterKey: 'm07', name: 'July',      bgColor: '#FFD8F3F3', textColor: '#FF64D0D0' },
    8:  { characterKey: 'm08', name: 'August',    bgColor: '#FFD8F3F3', textColor: '#FF64D0D0' },
    9:  { characterKey: 'm09', name: 'September', bgColor: '#FFFFEFDD', textColor: '#FFFFBF77' },
    10: { characterKey: 'm10', name: 'October',   bgColor: '#FFFFEFDD', textColor: '#FFFFBF77' },
    11: { characterKey: 'm11', name: 'November',  bgColor: '#FFFFEFDD', textColor: '#FFFFBF77' },
    12: { characterKey: 'm12', name: 'December',  bgColor: '#FFDDECFB', textColor: '#FF7AB4F0' },
};
const MONTH_CONFIG_C = {
    1:  { name: 'January',   NAME: 'JANUARY',   color: '#FF86A9D8', balloon: 'b1' },
    2:  { name: 'February',  NAME: 'FEBRUARY',  color: '#FF86A9D8', balloon: 'b1' },
    3:  { name: 'March',     NAME: 'MARCH',     color: '#FFFFA281', balloon: 'b2' },
    4:  { name: 'April',     NAME: 'APRIL',     color: '#FFFFA281', balloon: 'b2' },
    5:  { name: 'May',       NAME: 'MAY',       color: '#FFFFA281', balloon: 'b2' },
    6:  { name: 'June',      NAME: 'JUNE',      color: '#FF86C9B4', balloon: 'b3' },
    7:  { name: 'July',      NAME: 'JULY',      color: '#FF86C9B4', balloon: 'b3' },
    8:  { name: 'August',    NAME: 'AUGUST',     color: '#FF86C9B4', balloon: 'b3' },
    9:  { name: 'September', NAME: 'SEPTEMBER', color: '#FFFFBF77', balloon: 'b4' },
    10: { name: 'October',   NAME: 'OCTOBER',   color: '#FFFFBF77', balloon: 'b4' },
    11: { name: 'November',  NAME: 'NOVEMBER',  color: '#FFFFBF77', balloon: 'b4' },
    12: { name: 'December',  NAME: 'DECEMBER',  color: '#FF86A9D8', balloon: 'b1' },
};

const DAY_NAMES_EN = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
