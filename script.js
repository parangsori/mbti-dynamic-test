// 성격 유형 지표별 점수 초기화
let scoreE = 0;
let scoreS = 0;
let scoreT = 0;
let scoreJ = 0;

// 각 지표별로 4개씩 질문 풀 생성 (총 16개)
const questionPool = [
    // E / I
    { question: "주말에 약속이 없다면?", options: [{ text: "집에 있는다", type: "I" }, { text: "밖에 나가서 사람들을 만난다", type: "E" }], category: "EI" },
    { question: "새로운 모임에 나갈 때 나는?", options: [{ text: "구석에서 조용히 상황을 살핀다", type: "I" }, { text: "사람들에게 먼저 다가가 인사를 건넨다", type: "E" }], category: "EI" },
    { question: "스트레스를 푸는 방법은?", options: [{ text: "혼자만의 시간을 가지며 쉰다", type: "I" }, { text: "친구들과 만나 신나게 떠든다", type: "E" }], category: "EI" },
    { question: "내 이상적인 휴가는?", options: [{ text: "조용한 숙소에서 여유롭게 책 읽기", type: "I" }, { text: "사람들이 북적이는 파티나 축제 가기", type: "E" }], category: "EI" },

    // S / N
    { question: "새로운 일을 시작할 때 당신의 스타일은?", options: [{ text: "과거의 경험과 매뉴얼을 중시한다", type: "S" }, { text: "창의적이고 새로운 방식을 시도한다", type: "N" }], category: "SN" },
    { question: "사물을 볼 때 주로 어떠한가?", options: [{ text: "세세한 디테일을 먼저 본다 (나무)", type: "S" }, { text: "전체적인 흐름과 맥락을 본다 (숲)", type: "N" }], category: "SN" },
    { question: "요리를 할 때 나는?", options: [{ text: "레시피의 정량과 순서를 정확히 지킨다", type: "S" }, { text: "내 직감대로 재료를 추가하며 변형한다", type: "N" }], category: "SN" },
    { question: "영화를 보고 난 후 주로 기억에 남는 것은?", options: [{ text: "현실적인 배경, 소품, 대사 등 사실적 요소", type: "S" }, { text: "영화가 전하고자 하는 숨겨진 의미나 철학", type: "N" }], category: "SN" },

    // T / F
    { question: "친구가 힘든 고민을 털어놓을 때 나는?", options: [{ text: "현실적인 해결책과 조언을 생각한다", type: "T" }, { text: "친구의 감정에 깊이 공감해준다", type: "F" }], category: "TF" },
    { question: "무언가 결정을 내려야 할 때 더 중요한 기준은?", options: [{ text: "객관적인 사실과 논리적 타당성", type: "T" }, { text: "나와 주변 사람들의 감정과 관계", type: "F" }], category: "TF" },
    { question: "동료가 일에서 실수했을 때 나의 반응은?", options: [{ text: "어디서 틀렸는지 조목조목 알려준다", type: "T" }, { text: "상심하지 않게 돌려 말하며 격려한다", type: "F" }], category: "TF" },
    { question: "상대방에게 '공감된다'고 느낄 때는 언제인가?", options: [{ text: "내 의견을 뒷받침하는 타당한 근거를 말할 때", type: "T" }, { text: "내 감정을 깊이 헤아려주고 위로해줄 때", type: "F" }], category: "TF" },

    // J / P
    { question: "내일 갑자기 여행을 떠나게 된다면?", options: [{ text: "숙소와 교통편 정도는 미리 정해둔다", type: "J" }, { text: "일단 도착해서 상황에 맞게 즐긴다", type: "P" }], category: "JP" },
    { question: "준비물을 챙기거나 일을 마칠 때 나는?", options: [{ text: "체계적으로 리스트를 만들어 미리 끝낸다", type: "J" }, { text: "마감 직전 폭발적인 집중력으로 한 번에 끝낸다", type: "P" }], category: "JP" },
    { question: "방 청소는 보통 언제, 어떻게 하는 편인가?", options: [{ text: "주기적으로 날을 정해 규칙적으로 정돈한다", type: "J" }, { text: "필요성을 느낄 때 한꺼번에 몰아서 크게 치운다", type: "P" }], category: "JP" },
    { question: "약속 시간이 정해지면?", options: [{ text: "최소 10분 전에는 약속 장소에 도착해 있는다", type: "J" }, { text: "딱 맞춰서 가거나 가끔 조금 늦을 때가 있다", type: "P" }], category: "JP" }
];

let selectedQuestions = [];

const mbtiResults = {
    "ISTJ": {
        nickname: "청렴결백한 논리주의자",
        description: "철저하고 성실하게 책임을 다하며, 원칙을 중요하게 생각합니다.",
        scenario: "약속 시간 10분 전 도착 완료. 상대방이 1분이라도 늦으면 마음속으로 시계 바늘을 셉니다."
    },
    "ISFJ": {
        nickname: "용감한 수호자",
        description: "주변 사람들을 세심하게 살피고 돕는 따뜻한 보살핌의 아이콘입니다.",
        scenario: "누군가 재채기만 해도 조용히 가방에서 비타민과 휴지를 꺼내 건넵니다."
    },
    "INFJ": {
        nickname: "선의의 옹호자",
        description: "통찰력이 뛰어나며 자신만의 신념을 가지고 세상을 더 낫게 만들고자 합니다.",
        scenario: "침대에 누워 '인류는 어디로 가는가'에 대해 고민하다가 새벽 3시에 잠듭니다."
    },
    "INTJ": {
        nickname: "용의주도한 전략가",
        description: "분석적이고 독립적이며, 모든 일에 자신만의 체계적인 전략을 세웁니다.",
        scenario: "친구의 하소연을 들으며 머릿속으로는 문제 원인 분석과 해결책 5가지를 이미 코딩 완료했습니다."
    },
    "ISTP": {
        nickname: "만능 재주꾼",
        description: "냉철한 이성과 넘치는 호기심으로 도구를 다루는 데 능숙한 실용 주의자입니다.",
        scenario: "기계가 고장 나면 설명서도 안 보고 일단 다 뜯어봅니다. 결과는? 신통방통하게 고칩니다."
    },
    "ISFP": {
        nickname: "호기심 많은 예술가",
        description: "따뜻하고 감수성이 풍부하며, 현재의 순간을 즐기는 자유로운 영혼입니다.",
        scenario: "침대 위가 제1의 영토입니다. 넷플릭스만 있다면 한 달도 거뜬히 행복할 수 있습니다."
    },
    "INFP": {
        nickname: "열정적인 중재자",
        description: "상냥하고 이상주의적이며, 자신만의 깊은 가치관을 소중히 여깁니다.",
        scenario: "길가다 예쁜 구름을 보면 사진을 찍어 SNS에 감성 글귀와 함께 올리며 혼자 감동받습니다."
    },
    "INTP": {
        nickname: "논리적인 사색가",
        description: "끊임없이 새로운 지식을 탐구하며 이론적이고 분석적인 태도를 유지합니다.",
        scenario: "대화 중 뜬금없이 '근데 파리는 왜 발을 비빌까?' 같은 질문을 던져 분위기를 싸하게 만듭니다."
    },
    "ESTP": {
        nickname: "모험을 즐기는 사업가",
        description: "에너지가 넘치고 실생활에 강하며, 도전을 두려워하지 않는 행동파입니다.",
        scenario: "번지점프대에 서서 남들 망설일 때 이미 뛰어내리고 공중에서 셀카 찍고 있습니다."
    },
    "ESFP": {
        nickname: "자유로운 영혼의 연예인",
        description: "분위기를 밝게 만드는 사교적인 성격으로, 언제나 즐거움을 추구합니다.",
        scenario: "정적이 흐르는 순간을 참지 못해 아무말 대잔치를 시작하고 스스로 만족해합니다."
    },
    "ENFP": {
        nickname: "재기발랄한 활동가",
        description: "열정적이고 창의적이며, 새로운 사람들과 소통하는 것을 진심으로 즐깁니다.",
        scenario: "처음 본 옆 테이블 사람과 5분 만에 베프가 되어 다음 주 여행 약속까지 잡고 옵니다."
    },
    "ENTP": {
        nickname: "뜨거운 논쟁을 즐기는 변론가",
        description: "풍부한 상상력과 논리적인 말솜씨로 새로운 가능성을 찾아내는 아이디어 뱅크입니다.",
        scenario: "상대방의 논리적 허점을 발견하는 순간 눈이 번쩍 뜨이며 '그건 네 생각이고!'를 시전합니다."
    },
    "ESTJ": {
        nickname: "엄격한 관리자",
        description: "현실적이고 사실 중심적이며, 조직과 프로젝트를 체계적으로 관리하는 데 능숙합니다.",
        scenario: "친구들과의 저녁 모임 메뉴부터 장소 예약, 회비 정산까지 엑셀 파일로 정리해 공유합니다."
    },
    "ESFJ": {
        nickname: "사교적인 외교관",
        description: "친절하고 동정심이 많으며, 집단 내의 조화와 협력을 중요하게 생각합니다.",
        scenario: "모임에서 물 떨어진 사람, 휴지 필요한 사람을 귀신같이 찾아내 챙겨주는 친절 끝판왕입니다."
    },
    "ENFJ": {
        nickname: "정의로운 사회운동가",
        description: "넘치는 카리스마와 열정으로 사람들을 이끄는 천부적인 리더 타입입니다.",
        scenario: "고민 상담을 해주다가 자기 일보다 더 화를 내거나 감동받아 같이 울어줍니다."
    },
    "ENTJ": {
        nickname: "대담한 통찰가",
        description: "비전이 뚜렷하고 추진력이 강하며, 효율적으로 조직을 이끌어 목표를 달성합니다.",
        scenario: "조별 과제에서 '오늘 밤 12시까지 각자 맡은 부분 완료해서 단톡방에 올리세요.'라고 딱 잘라 말합니다."
    }
};

let currentIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('start-screen');
    const questionScreen = document.getElementById('question-screen');
    const resultScreen = document.getElementById('result-screen');
    
    const startBtn = document.getElementById('start-btn');
    const optionABtn = document.getElementById('option-a');
    const optionBBtn = document.getElementById('option-b');
    const questionText = document.getElementById('question-text');
    const questionNumText = document.getElementById('question-number');
    const progressFill = document.getElementById('progress');
    
    // Result elements
    const mbtiName = document.getElementById('mbti-type');
    const mbtiNickname = document.getElementById('mbti-nickname');
    const mbtiDescription = document.getElementById('mbti-description');
    const mbtiScenario = document.getElementById('mbti-scenario');
    const restartBtn = document.getElementById('restart-btn');

    function initRandomQuestions() {
        // 각 지표에서 무작위로 2개씩 가져오기
        const groups = { EI: [], SN: [], TF: [], JP: [] };
        questionPool.forEach(q => groups[q.category].push(q));
        
        selectedQuestions = [];
        Object.keys(groups).forEach(cat => {
            groups[cat].sort(() => Math.random() - 0.5);
            selectedQuestions.push(groups[cat][0], groups[cat][1]);
        });
        
        // 전체 질문 순서 섞기 (E/I, S/N 등 구분없이 섞음)
        selectedQuestions.sort(() => Math.random() - 0.5);
        
        // 각 질문 내부의 옵션 순서 섞기
        selectedQuestions.forEach(q => {
            q.options.sort(() => Math.random() - 0.5);
        });
    }

    startBtn.addEventListener('click', () => {
        initRandomQuestions();
        startScreen.classList.add('hidden');
        questionScreen.classList.remove('hidden');
        renderQuestion();
    });

    optionABtn.addEventListener('click', () => handleSelect(0));
    optionBBtn.addEventListener('click', () => handleSelect(1));

    restartBtn.addEventListener('click', () => {
        currentIndex = 0;
        scoreE = 0; scoreS = 0; scoreT = 0; scoreJ = 0;
        resultScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        const resultImg = document.getElementById('mbti-image');
        if (resultImg) resultImg.classList.add('hidden');
    });

    function renderQuestion() {
        if (currentIndex >= selectedQuestions.length) {
            showResult();
            return;
        }

        const q = selectedQuestions[currentIndex];
        questionNumText.innerText = `Q${currentIndex + 1}.`;
        questionText.innerText = q.question;
        optionABtn.innerText = q.options[0].text;
        optionBBtn.innerText = q.options[1].text;
        
        const progressPercent = ((currentIndex + 1) / selectedQuestions.length) * 100;
        progressFill.style.width = `${progressPercent}%`;
    }

    function handleSelect(optionIndex) {
        const q = selectedQuestions[currentIndex];
        const selectedType = q.options[optionIndex].type;
        
        if (selectedType === "E") scoreE++;
        if (selectedType === "S") scoreS++;
        if (selectedType === "T") scoreT++;
        if (selectedType === "J") scoreJ++;
        
        currentIndex++;
        
        setTimeout(() => {
            renderQuestion();
        }, 200);
    }

    function showResult() {
        questionScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        
        // 동점 시 앞자리 선호(기본 설정)
        const mbti = 
            (scoreE >= 1 ? 'E' : 'I') +
            (scoreS >= 1 ? 'S' : 'N') +
            (scoreT >= 1 ? 'T' : 'F') +
            (scoreJ >= 1 ? 'J' : 'P');
        
        const result = mbtiResults[mbti];
        
        mbtiName.innerText = mbti;
        mbtiNickname.innerText = result.nickname;
        mbtiDescription.innerText = result.description;
        mbtiScenario.innerText = result.scenario;

        const resultImg = document.getElementById('mbti-image');
        if (resultImg) {
            resultImg.src = `resources/${mbti}.png`;
            resultImg.alt = `${mbti} Character`;
            resultImg.classList.remove('hidden');
        }
    }
});
