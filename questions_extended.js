/**
 * questions_extended.js — 문제은행 확장 (19-54) 및 메타데이터
 */

export const QUESTIONS_EXTENDED = {
  EI: [
    /* ── anchor ── */
    {
      q: "드디어 금요일 퇴근! 일주일간 쌓인 피로를 푸는 나만의 방식은?",
      options: [
        { text: "친구들 불러서 맛있는 거 먹고 수다 떨며 스트레스 발산", type: "E", micro: "사람 에너지가 최고의 보약 🔋" },
        { text: "무조건 집으로 직행! 휴대폰 무음으로 하고 혼자 뒹굴거리기", type: "I", micro: "나만의 동굴이 최고의 리조트 🏠" }
      ]
    },
    {
      q: "처음 가는 모임에서 자기소개를 해야 할 때, 내 속마음은?",
      options: [
        { text: "오히려 나를 알릴 기회! 당당하고 유쾌하게 말함", type: "E", micro: "자기소개도 하나의 무대 🌟" },
        { text: "제발 내 순서가 천천히 오길... 최대한 짧고 굵게 끝냄", type: "I", micro: "심장 박동수 실시간 상승 중 👀" }
      ]
    },
    {
      q: "답답한 고민이 생겼을 때, 내가 먼저 찾는 해결법은?",
      options: [
        { text: "주변 사람들에게 말하며 털어놓다 보면 답이 나옴", type: "E", micro: "소통이 곧 사고의 도구 💬" },
        { text: "혼자 산책하거나 일기를 쓰면서 생각을 정리함", type: "I", micro: "내면의 서재에서 답을 찾음 🧠" }
      ]
    },
    {
      q: "어려운 결정을 내려야 할 때, 나는 주로?",
      options: [
        { text: "여러 사람의 의견을 들어보고 조언을 구함", type: "E", micro: "집단 지성의 힘을 믿음 🗣️" },
        { text: "내 안의 목소리에 집중하며 스스로 결론을 내림", type: "I", micro: "독립적인 판단의 무게 🎣" }
      ]
    },
    {
      q: "회식이나 모임 분위기가 무르익었을 때, 내 상태는?",
      options: [
        { text: "더 신나서 분위기를 주도하거나 끝까지 남음", type: "E", micro: "모임의 끝을 장식하는 에너자이저 🍻" },
        { text: "슬슬 집에 갈 타이밍을 노리며 에너지를 아낌", type: "I", micro: "정중한 퇴장을 꿈꾸는 귀가 본능 🏯" }
      ]
    },
    {
      q: "단톡방에서 내 의견과 다른 흐름으로 대화가 진행된다면?",
      options: [
        { text: "중간에 적극적으로 끼어들어 내 생각도 말함", type: "E", micro: "대화 흐름에 참전 🎤" },
        { text: "일단 지켜보다가 상황이 정리되면 조심스럽게 말함", type: "I", micro: "신중한 타이밍 포착 ✉️" }
      ]
    },
    {
      q: "내가 더 선호하는 긴밀한 연락 방식은?",
      options: [
        { text: "전화해서 생생한 목소리를 듣는 게 속 편함", type: "E", micro: "실시간 연결의 즐거움 📞" },
        { text: "톡이나 문자로 기록을 남기며 대화하는 게 좋음", type: "I", micro: "생각할 시간을 주는 텍스트 소통 📱" }
      ]
    },

    /* ── discriminator ── */
    {
      q: "혼자만의 작업 중, 옆자리에 아는 지인이 앉는다면?",
      options: [
        { text: "반갑게 아는 척하며 중간중간 대화도 섞음", type: "E", micro: "함께라서 더 즐거운 집중 ☕" },
        { text: "인사는 하되 다시 내 작업에만 열중하려고 애씀", type: "I", micro: "나만의 집중 장막 유지 🫧" }
      ]
    },
    {
      q: "내가 생각하는 가장 효율적인 공부 환경은?",
      options: [
        { text: "적당한 소음과 사람들이 있는 카페나 개방적인 공간", type: "E", micro: "외부 자극이 활력이 됨 🎶" },
        { text: "아무 소음도 없고 방해받지 않는 독서실 같은 공간", type: "I", micro: "고요함 속의 극강 효율 🔇" }
      ]
    },
    {
      q: "친구와 사소한 다툼 후, 연락하는 시점은?",
      options: [
        { text: "바로 전화해서 대화로 푸는 게 가장 깔끔함", type: "E", micro: "빠른 환기가 최고의 해결 🌬️" },
        { text: "감정을 좀 가라앉히고 밤에 장문의 톡을 보냄", type: "I", micro: "준비된 진심이 더 정확함 🎯" }
      ]
    },
    {
      q: "파티나 모임에서 처음 본 사람이 여러 명일 때 나는?",
      options: [
        { text: "오히려 새로운 자극이 즐거워 여러 사람과 대화함", type: "E", micro: "잠재적 친구 탐색 중 😊" },
        { text: "가까이 있는 한두 명이랑만 깊은 이야기를 나눔", type: "I", micro: "양보다 질의 대화 철학 🌿" }
      ]
    },
    {
      q: "나의 창의력이 가장 폭발하는 순간은?",
      options: [
        { text: "사람들과 아이디어를 주고받으며 토론할 때", type: "E", micro: "타인의 한 마디가 촉매제 ⚗️" },
        { text: "혼자 깊은 생각에 잠기거나 몽상에 빠질 때", type: "I", micro: "내면의 편집실 가동 중 🧩" }
      ]
    },
    {
      q: "집중해서 일하는 중 누가 말을 걸면?",
      options: [
        { text: "잠깐 대화하고 다시 자연스럽게 몰입함", type: "E", micro: "멀티태스킹의 달인 🔄" },
        { text: "맥이 끊긴 것 같아 다시 집중하기까지 시간이 좀 걸림", type: "I", micro: "집중 모드는 성역 ⛔" }
      ]
    },
    {
      q: "오늘 하루 정말 힘들었다면, 가장 그리운 건?",
      options: [
        { text: "절친과 맛있는 술 한잔하며 수다 떨기", type: "E", micro: "대화로 털어내는 스트레스 ⚡" },
        { text: "뜨거운 물로 샤워하고 내 비좁은 방에 쏙 들어가기", type: "I", micro: "나만의 고요한 힐링 🧘" }
      ]
    },
    {
      q: "협업 과제와 단독 과제 중 나에게 더 맞는 건?",
      options: [
        { text: "같이 시너지를 내며 결과물을 만드는 협업", type: "E", micro: "함께 가는 즐거움 🤝" },
        { text: "내 페이스대로 완벽하게 책임지는 단독 작업", type: "I", micro: "1인 역량의 정수 💪" }
      ]
    },
    {
      q: "여행지에서 내가 느끼는 가장 큰 즐거움은?",
      options: [
        { text: "게스트하우스에서 새로운 여행자들과 친해지는 것", type: "E", micro: "사람이 곧 풍경인 여행 🌍" },
        { text: "아무도 모르는 장소에서 혼자 여유롭게 풍경을 보는 것", type: "I", micro: "사색으로 채우는 여행 🗺️" }
      ]
    },
    {
      q: "비어 있는 평일 저녁, 내 마음가짐은?",
      options: [
        { text: "약속이 없으면 뭔가 허전해서 누구라도 만나고 싶음", type: "E", micro: "사람 찾기 본능 📲" },
        { text: "아무 약속 없는 저녁이 선물같이 느껴져서 설렘", type: "I", micro: "비어있음의 완벽한 충전 🎁" }
      ]
    },

    /* ── forced_choice ── */
    {
      q: "내가 더 견디기 쉬운 상황은?",
      options: [
        { text: "정신없을 정도로 활발하고 시끄러운 모임", type: "E", micro: "소음조차 활기차게 느낌 👥" },
        { text: "적막이 흐를 정도로 정적이고 조용한 공간", type: "I", micro: "침묵은 곧 몰입의 기회 🎬" }
      ]
    },
    {
      q: "나를 더 잘 설명하는 문장은?",
      options: [
        { text: "말로 내뱉어야 내 생각이 정리된다", type: "E", micro: "발화가 곧 사고의 증거 💭" },
        { text: "생각이 다 정리되어야 입 밖으로 말이 나온다", type: "I", micro: "정제된 한 마디의 무게 🏗️" }
      ]
    },
    {
      q: "내가 에너지를 얻는 근본적인 통로는?",
      options: [
        { text: "세상 밖으로 나가 여러 사람과 상호작용하는 것", type: "E", micro: "외부 세계로의 접속 🔌" },
        { text: "세상과 단절하고 내면의 세계로 침잠하는 것", type: "I", micro: "내면 세계로의 접속 🔄" }
      ]
    },
    {
      q: "더 자연스러운 내 주말 모습은?",
      options: [
        { text: "밖에서 에너지를 쓰고 기분 좋게 들어옴", type: "E", micro: "외부 활동형 🎊" },
        { text: "집에서 에너지를 비축하고 조용히 휴식함", type: "I", micro: "내부 비축형 🕯️" }
      ]
    },
    {
      q: "모임에서 대화가 끊겼을 때 내 반응은?",
      options: [
        { text: "어색함을 못 참고 다음 화제를 제시함", type: "E", micro: "소통의 지휘자 🎙️" },
        { text: "그냥 그 어색한 공기를 즐기거나 기다림", type: "I", micro: "침묵의 감상자 🎧" }
      ]
    },
    {
      q: "더 행복한 에너지가 도는 순간은?",
      options: [
        { text: "내가 주인공이 되어 주목받는 생일 파티", type: "E", micro: "화려한 스포트라이트 💥" },
        { text: "조용한 공간에서 책이나 음악에 푹 빠진 오후", type: "I", micro: "은은한 촛불 같은 시간 🔭" }
      ]
    },
    {
      q: "나에게 더 해당하는 설명은?",
      options: [
        { text: "처음 만난 사람과도 1시간 만에 배프가 될 수 있음", type: "E", micro: "친화력 불도저 🌊" },
        { text: "친해지려면 최소한 세 번은 만나야 마음이 열림", type: "I", micro: "시간이 빚어낸 진심 ❄️" }
      ]
    },
    {
      q: "어느 쪽이 더 즐거운 밥상일까?",
      options: [
        { text: "여럿이서 왁자지껄하게 웃으며 떠드는 식사", type: "E", micro: "사람 맛이 반찬 😂" },
        { text: "딱 한 명이나 혼자서 조용하고 정적인 식사", type: "I", micro: "음식 맛에 오롯이 집중 🕊️" }
      ]
    },

    /* ── consistency ── */
    {
      q: "나에게 '진짜 휴식'이란?",
      options: [
        { text: "좋아하는 사람들과 즐거운 시간을 보내는 것", type: "E", micro: "함께함의 가치 🔌" },
        { text: "아무 방해 없이 혼자만의 시간을 갖는 것", type: "I", micro: "독립된 존재의 가치 🔄" }
      ]
    },
    {
      q: "모임 다음 날 아침, 내 기분은?",
      options: [
        { text: "어제 너무 즐거웠어! 오늘도 힘내서 활기차게!", type: "E", micro: "만남의 여운 ✨" },
        { text: "어제의 나... 사회성 불태웠다... 오늘은 절대 집 밖으로 안 나감", type: "I", micro: "에너지 리필 중 🚧" }
      ]
    },
    {
      q: "솔직히 낯설고 어색한 자리에서 내 상태는?",
      options: [
        { text: "조금 버티다 보면 어느새 적응해서 즐기고 있음", type: "E", micro: "적응의 화신 🏃" },
        { text: "빨리 이 시간이 지나가고 내 방으로 돌아가고 싶음", type: "I", micro: "탈출 욕구 폭발 🚪" }
      ]
    },

    /* ── state ── */
    {
      q: "지금 이 순간, 나에게 더 필요한 건?",
      options: [
        { text: "마음껏 누군가와 수다 떨며 기분 전환하기", type: "E", micro: "외적 소망 📡" },
        { text: "세상으로부터 격리되어 조용히 나를 돌보기", type: "I", micro: "내적 소망 🔕" }
      ]
    },
    {
      q: "오늘 하루, 어떤 색으로 채우고 싶나요?",
      options: [
        { text: "활기가 넘치는 비비드한 컬러", type: "E", micro: "팝한 활력 ⚡" },
        { text: "차분하고 고요한 파스텔 톤", type: "I", micro: "은은한 여백 🌙" }
      ]
    },

    /* ── parallel ── */
    {
      q: "예상치 못한 휴일, 사람 없는 시간이 생겼다면?",
      options: [
        { text: "누가 근처에 있나 살펴보고 연락함", type: "E", micro: "사람 찾기 본능 📭" },
        { text: "아무도 연락 안 왔으면 좋겠다... 나만의 시간 만끽", type: "I", micro: "고독 테라피 🌿" }
      ]
    },
    {
      q: "기분이 울적할 때, 내가 더 위로받는 방식은?",
      options: [
        { text: "사람들을 만나서 웃고 떠들며 감정을 환기함", type: "E", micro: "공유를 통한 해소 🤝" },
        { text: "슬픈 노래나 영화를 보며 혼자 충분히 삭힘", type: "I", micro: "자아 성찰적 해소 📝" }
      ]
    },
    {
      q: "갑작스러운 발표나 무대에 서야 한다면?",
      options: [
        { text: "긴장되지만 어느 순간 그 긴장감을 즐기기 시작함", type: "E", micro: "내 마음의 무대 🎭" },
        { text: "빨리 이 순간이 지나가기만을 기도하며 마침", type: "I", micro: "소리 없는 아우성 🪫" }
      ]
    },
    {
      q: "생일 파티를 한다면, 어떤 파티가 최고의 파티?",
      options: [
        { text: "아는 사람들은 다 모인 듯한 왁자지껄한 대형 파티", type: "E", micro: "축제 중독 🎉" },
        { text: "진짜 친한 소수만 모여서 도란도란 나누는 홈 파티", type: "I", micro: "소수 정예 🕯️" }
      ]
    },
    {
      q: "아무 계획 없는 일요일 아침, 자연스럽게 나는?",
      options: [
        { text: "휴대폰 확인하며 밖으로 나갈 거리를 찾음", type: "E", micro: "외부 지향 🌈" },
        { text: "이불 속에서 가장 편안한 자세로 뒹굴거림", type: "I", micro: "내부 지향 🛋️" }
      ]
    },
    {
      q: "처음 보는 사람들 사이에서 나는?",
      options: [
        { text: "어색함을 깨기 위해 내가 먼저 가벼운 질문을 던짐", type: "E", micro: "아이스브레이킹 달인 🧭" },
        { text: "조용히 경청하며 분위기가 무르익을 때까지 기다림", type: "I", micro: "침묵의 신사 🦉" }
      ]
    }
  ],

  SN: [
    /* ── anchor ── */
    {
      q: "유튜브 알고리즘이 나를 사로잡는 포인트는?",
      options: [
        { text: "생생한 후기, 실제 리뷰, 당장 써먹을 수 있는 꿀팁", type: "S", micro: "현실의 팩트 체크 📊" },
        { text: "신박한 가상 시나리오, 철학적인 깨달음, 우주적 고찰", type: "N", micro: "의미의 재해석 🕸️" }
      ]
    },
    {
      q: "누군가 신규 사업 아이템을 제안한다면 내 첫 반응은?",
      options: [
        { text: "그래서 수익 모델이 뭐야? 실제로 가능해?", type: "S", micro: "땅에 발 붙인 검증 🌱" },
        { text: "와, 이거 나중에 여기까지 확장될 수 있겠는데?", type: "N", micro: "미래를 그리는 상상 🚀" }
      ]
    },
    {
      q: "친구에게 겪었던 재미있는 일을 전달할 때 내 화법은?",
      options: [
        { text: "누가, 언제, 어디서 그랬는지 팩트 위주로 생생하게 전달", type: "S", micro: "인간 CCTV급 묘사 📹" },
        { text: "그 상황이 준 전체적인 느낌과 여운을 중심으로 전달", type: "N", micro: "분위기가 핵심 🎨" }
      ]
    },
    {
      q: "책을 읽거나 강의를 볼 때 더 끌리는 내용은?",
      options: [
        { text: "실제로 문제를 해결할 수 있는 단계별 프로세스", type: "S", micro: "실질적 도움 🔧" },
        { text: "세상을 바라보는 새로운 시너 이면의 숨겨진 원리", type: "N", micro: "지적인 확장 🗺️" }
      ]
    },
    {
      q: "전시회나 박람회에 갔을 때, 내가 더 깊이 보는 건?",
      options: [
        { text: "작품의 실제 재료, 기법, 완벽한 디테일들", type: "S", micro: "실체를 향한 시선 🔩" },
        { text: "작가가 전하려는 추상적인 메시지와 세계관", type: "N", micro: "의미를 향한 시선 🗻" }
      ]
    },
    {
      q: "미래의 내 모습을 그려볼 때 더 구체적인 쪽은?",
      options: [
        { text: "내가 살 집의 인테리어, 통장 잔고, 타는 차 종류", type: "S", micro: "현실의 아카이브 📋" },
        { text: "내가 어떤 가치를 실현하며 누구와 어떤 꿈을 꿀지", type: "N", micro: "꿈의 아카이브 🎲" }
      ]
    },
    {
      q: "관심 분야의 모임에 나갔을 때 좋아하는 주제는?",
      options: [
        { text: "실제 경험담이나 업계의 최신 팩트 뉴스", type: "S", micro: "사실 확인 📰" },
        { text: "업계의 미래 전망이나 아직 없는 새로운 가능성", type: "N", micro: "가능성 타진 🔭" }
      ]
    },

    /* ── discriminator ── */
    {
      q: "길을 잃었을 때, 내가 더 신뢰하는 지도 방식은?",
      options: [
        { text: "300m 앞 편의점에서 우회전 하세요", type: "S", micro: "정교한 네비 📍" },
        { text: "저 산 아래 큰 건물이 보이는 쪽으로 쭉 가세요", type: "N", micro: "공간적 개념 🏢" }
      ]
    },
    {
      q: "영화의 엔딩 크레딧이 올라올 때 드는 첫 생각은?",
      options: [
        { text: "주인공이 막판에 왜 그랬는지 사건 전개를 복기함", type: "S", micro: "스토리 로직 🎬" },
        { text: "이 영화가 상징하는 우리네 삶의 단면을 고찰함", type: "N", micro: "여운의 철학 🌊" }
      ]
    },
    {
      q: "설명을 들을 때 '아, 이제 알겠다!' 싶은 순간은?",
      options: [
        { text: "실제로 어떻게 작동하는지 시연을 보여줄 때", type: "S", micro: "백문이 불여일독 💡" },
        { text: "이게 전체적인 시스템에서 어떤 역할인지 이해될 때", type: "N", micro: "숲을 보는 안목 🗺️" }
      ]
    },
    {
      q: "내 휴대폰 사진첩을 가득 채우고 있는 것은?",
      options: [
        { text: "생생한 기록들, 음식, 친구들과 찍은 인물 사진", type: "S", micro: "사실의 파편 🔎" },
        { text: "예쁜 하늘이나 감성 돋는 분위기, 영감을 주는 글귀", type: "N", micro: "영감의 조각 🌀" }
      ]
    },
    {
      q: "공부할 때 내가 더 선호하는 자료는?",
      options: [
        { text: "핵심만 요약된 도표와 실제 기출 문제 예시", type: "S", micro: "효율의 끝 📘" },
        { text: "원리부터 차분히 설명해주는 깊이 있는 비유들", type: "N", micro: "깊이의 끝 💬" }
      ]
    },
    {
      q: "남에게 정보를 전달할 때 더 공들이는 부분은?",
      options: [
        { text: "오타나 오보가 없는 완벽한 팩트 보존", type: "S", micro: "무결점 데이터 📊" },
        { text: "전체적인 메시지가 명확하고 조화롭게 전달됨", type: "N", micro: "조화로운 맥락 🎯" }
      ]
    },
    {
      q: "취미 생활을 할 때 내가 추구하는 것은?",
      options: [
        { text: "수치화된 실력 향상이나 눈에 보이는 작업물", type: "S", micro: "성취의 맛 📈" },
        { text: "그 과정 자체에서 느끼는 창조적인 기쁨", type: "N", micro: "발견의 맛 🌀" }
      ]
    },
    {
      q: "낯선 카페에 들어갔을 때 내 시선이 먼저 머무는 곳은?",
      options: [
        { text: "인테리어 소품들의 배치, 의자의 편안함, 메뉴판", type: "S", micro: "환경 스캐닝 🔬" },
        { text: "이 카페를 만든 사람이 주려는 전체적인 분위기", type: "N", micro: "이미지 투사 📖" }
      ]
    },
    {
      q: "자연경관을 볼 때 드는 생각은?",
      options: [
        { text: "와, 저 나무는 저렇게 생겼구나... 생생하네", type: "S", micro: "사실적 예찬 🔩" },
        { text: "저 거대한 대자연 속에 나는 어떤 존재일까?", type: "N", micro: "추상적 예찬 🌌" }
      ]
    },
    {
      q: "내 기억력이 가장 잘 발휘되는 분야는?",
      options: [
        { text: "전화번호, 주소, 친구의 생일 같은 세세한 사실", type: "S", micro: "데이터 뱅크 📂" },
        { text: "그때의 공기, 기분, 대화의 큰 흐름과 인상", type: "N", micro: "인상주의 갤러리 🌅" }
      ]
    },

    /* ── forced_choice ── */
    {
      q: "더 나에게 어필하는 말은?",
      options: [
        { text: "직접 해보는 게 백 번 듣는 것보다 낫다", type: "S", micro: "경험 제일주의 🤲" },
        { text: "원리를 이해하는 게 무작정 해보는 것보다 낫다", type: "N", micro: "이해 제일주의 🧩" }
      ]
    },
    {
      q: "내가 더 믿음을 갖는 쪽은?",
      options: [
        { text: "이미 수많은 사람이 검증한 전통적인 방식", type: "S", micro: "안전이 최고 🍎" },
        { text: "아직 알려지지 않았지만 획기적인 새로운 방식", type: "N", micro: "혁신이 최고 🏗️" }
      ]
    },
    {
      q: "내 인생 철학에 더 가까운 것은?",
      options: [
        { text: "현재에 충실하며 눈앞의 행복을 찾자", type: "S", micro: "리얼리스트 ⚓" },
        { text: "미래를 꿈꾸며 더 나은 가능성을 열어두자", type: "N", micro: "비저너리 🌱" }
      ]
    },
    {
      q: "더 끌리는 표현은?",
      options: [
        { text: "손에 잡히는 확실한 진실", type: "S", micro: "실증주의 📐" },
        { text: "가슴을 뛰게 하는 무한한 상상", type: "N", micro: "낭만주의 🔮" }
      ]
    },
    {
      q: "정보를 들을 때 내 머릿속 가동 순서는?",
      options: [
        { text: "'그래서 어떻게 하면 돼?' 구체적 결론부터", type: "S", micro: "실질적 사고 🎯" },
        { text: "'도대체 왜?' 근본적인 배경부터", type: "N", micro: "탐구적 사고 🌊" }
      ]
    },
    {
      q: "내 머릿속 안테나는 주로 어디를 향하나요?",
      options: [
        { text: "현실의 땅을 굳건히 딛고 있는 사실들", type: "S", micro: "사실의 세계 🧩" },
        { text: "하늘 높이 떠 있는 무구한 아이디어들", type: "N", micro: "개념의 세계 🧩" }
      ]
    },
    {
      q: "어떤 이야기가 더 재미있나요?",
      options: [
        { text: "실화에 기반한 생생하고 현실적인 이야기", type: "S", micro: "현실 고증 🎥" },
        { text: "상징과 은유가 가득한 신비로운 이야기", type: "N", micro: "메타포 🌿" }
      ]
    },
    {
      q: "나를 더 자극하는 문장은?",
      options: [
        { text: "있는 그대로를 완벽하게 모사하자", type: "S", micro: "모사 🌍" },
        { text: "나만의 색으로 새롭게 창조하자", type: "N", micro: "창조 ☁️" }
      ]
    },

    /* ── consistency ── */
    {
      q: "새로운 기계를 샀을 때, 내 행동은?",
      options: [
        { text: "매뉴얼을 정독하며 올바른 사용법을 익힘", type: "S", micro: "정석 루트 📖" },
        { text: "일단 켜보고 감으로 여기저기 눌러봄", type: "N", micro: "탐험 루트 🧂" }
      ]
    },
    {
      q: "흥미로운 소식을 들었을 때 내 반응은?",
      options: [
        { text: "와 진짜? 그래서 그다음엔 어떻게 됐어?", type: "S", micro: "현실적 리액터 ✅" },
        { text: "와 신기하다! 혹시 이게 그거랑 관련 있는 거야?", type: "N", micro: "연결적 리액터 🎲" }
      ]
    },
    {
      q: "나는 언제 내가 똑똑하다고 느껴지나요?",
      options: [
        { text: "헷갈리는 사실이나 정보를 정확히 짚어냈을 때", type: "S", micro: "팩트 체크 💡" },
        { text: "전혀 상관없어 보이던 것들의 연결고리를 찾아냈을 때", type: "N", micro: "통찰의 발견 🌲" }
      ]
    },

    /* ── state ── */
    {
      q: "지금 내 머릿속 비율은?",
      options: [
        { text: "오늘 할 일, 현실의 고민이 80%", type: "S", micro: "현실 지배 ✔️" },
        { text: "엉뚱한 상상, 우주의 미래가 80%", type: "N", micro: "망상 지배 💫" }
      ]
    },
    {
      q: "오늘 하루, 나를 더 설레게 하는 것은?",
      options: [
        { text: "실제로 갖고 싶던 물건을 손에 넣는 것", type: "S", micro: "소유의 기쁨 📋" },
        { text: "아직 아무도 모르는 새로운 비밀을 깨닫는 것", type: "N", micro: "깨달음의 기쁨 🌊" }
      ]
    },

    /* ── parallel ── */
    {
      q: "내가 더 좋아하는 SNS 게시물 스타일은?",
      options: [
        { text: "오늘의 일상 기록, 맛집 사진, 확실한 정보성 글", type: "S", micro: "현장 기록 📷" },
        { text: "감성적인 사진, 시적인 문구, 고찰이 담긴 글", type: "N", micro: "분위기 전달 🎞️" }
      ]
    },
    {
      q: "무언가를 메모할 때 내 스타일은?",
      options: [
        { text: "나중에 다시 봐도 정확히 알 수 있게 팩트 위주로 적음", type: "S", micro: "기록 📌" },
        { text: "나만 알아볼 수 있어도 좋으니 영감 위주로 적음", type: "N", micro: "메모 🖊️" }
      ]
    },
    {
      q: "지도 앱 없이 길을 찾아야 한다면?",
      options: [
        { text: "지나온 수많은 건물들과 간판들을 기억해냄", type: "S", micro: "디테일 📐" },
        { text: "방향 감각과 주변 분위기를 더듬으며 찾아감", type: "N", micro: "감각 🧭" }
      ]
    },
    {
      q: "여행지 정보를 얻을 때 더 눈이 가는 곳은?",
      options: [
        { text: "교통비, 팁, 운영 시간 등 실생활에 꼭 필요한 팁", type: "S", micro: "실용 🗺️" },
        { text: "그 지역이 가진 역사적 배경이나 특별한 의미", type: "N", micro: "의미 🌍" }
      ]
    },
    {
      q: "게임을 할 때 내 스타일은?",
      options: [
        { text: "퀘스트를 클리어하고 레벨을 올리는 효율적인 플레이", type: "S", micro: "성장 🔍" },
        { text: "이 맵에는 무엇이 숨겨져 있을지 맵 전체를 탐험하는 플레이", type: "N", micro: "탐험 🎮" }
      ]
    },
    {
      q: "음악을 감상할 때 내가 더 빠지는 포인트는?",
      options: [
        { text: "귀를 즐겁게 하는 선율과 리듬, 완벽한 사운드", type: "S", micro: "사운드 🎵" },
        { text: "가사가 가진 철학적인 의미와 그 노래가 주는 정서", type: "N", micro: "가사 📜" }
      ]
    }
  ],

  TF: [
    /* ── anchor ── */
    {
      q: "모임에서 친구 간의 오해가 생겼다면, 내가 생각하는 최우선 해결책은?",
      options: [
        { text: "누가 잘못했는지 팩트를 확실히 짚고 사과하는 것", type: "T", micro: "명확한 시시비비 📐" },
        { text: "일단 서로의 서운한 감정을 먼저 달래주는 것", type: "F", micro: "따뜻한 감정 해소 🤝" }
      ]
    },
    {
      q: "인생의 갈림길에서 내 최종 결정 도구는?",
      options: [
        { text: "각 선택지의 장단점을 철저히 따지는 이성", type: "T", micro: "이성의 칼날 🧭" },
        { text: "어느 쪽이 나를 더 행복하게 할지 묻는 가슴", type: "F", micro: "가슴의 소리 💗" }
      ]
    },
    {
      q: "친구가 명백히 틀린 고집을 피울 때 나는?",
      options: [
        { text: "논리적으로 반박해서 친구가 틀렸음을 깨닫게 함", type: "T", micro: "정의로운 지적 ✂️" },
        { text: "분위기를 봐서 최대한 기분 안 상하게 슬쩍 돌려 말함", type: "F", micro: "상냥한 배려 💌" }
      ]
    },
    {
      q: "팀원을 평가해야 하는 민감한 상황에서 내 태도는?",
      options: [
        { text: "개인적인 감정은 배제하고 오직 성과로만 평가함", type: "T", micro: "철저한 객관성 💡" },
        { text: "그 사람의 노력과 상황을 고려하여 최대한 포용적으로 평가함", type: "F", micro: "따뜻한 인간미 🌸" }
      ]
    },
    {
      q: "화난 지인을 마주했을 때 내 뇌리에 스치는 질문은?",
      options: [
        { text: "'무슨 일이 있었던 거지? 원인이 뭐야?'", type: "T", micro: "논리적 분석 🔍" },
        { text: "'와, 정말 화났겠다... 어떻게 달래주지?'", type: "F", micro: "감정적 조율 🫂" }
      ]
    },
    {
      q: "고민이 많아서 상담을 요청할 때 내가 진짜 바라는 건?",
      options: [
        { text: "상황을 객관적으로 진단하고 해결책을 제시해주는 것", type: "T", micro: "효과적인 솔루션 💡" },
        { text: "내 입장을 전적으로 이해하고 내 편이 되어주는 것", type: "F", micro: "무조건적인 내 편 🤍" }
      ]
    },
    {
      q: "칭찬을 할 때 내 방식은?",
      options: [
        { text: "결과물이 얼마나 훌륭한지 조목조목 짚어줌", type: "T", micro: "근거 있는 극찬 🏆" },
        { text: "그 과정에서 정성이 얼마나 돋보였는지 마음을 전함", type: "F", micro: "진심 어린 감동 🌷" }
      ]
    },

    /* ── discriminator ── */
    {
      q: "말다툼 중 상대방이 눈물을 보인다면?",
      options: [
        { text: "왜 우는지 당황스럽지만 하고 싶은 말은 계속해야 함", type: "T", micro: "결론 지향 ⚖️" },
        { text: "일단 다툼을 멈추고 상대방의 기분부터 살핌", type: "F", micro: "관계 지향 🚪" }
      ]
    },
    {
      q: "내가 더 정의롭다고 느끼는 순간은?",
      options: [
        { text: "법과 원칙이 누구에게나 공정하게 지켜질 때", type: "T", micro: "원칙의 정의 ⚖️" },
        { text: "약자의 상황을 배려해주는 관용이 베풀어질 때", type: "F", micro: "관용의 정의 🌈" }
      ]
    },
    {
      q: "친구의 실수로 우리 팀 과제가 망쳤다면 나는?",
      options: [
        { text: "분명히 잘못된 부분을 지적하고 수정을 요구함", type: "T", micro: "명확한 평가 🗡️" },
        { text: "속상하지만 친구가 무안해할까 봐 다음부터 잘하자며 다독임", type: "F", micro: "화합의 격려 🌿" }
      ]
    },
    {
      q: "논쟁에서 이겼을 때 내가 느끼는 기분은?",
      options: [
        { text: "내 논리가 맞았다는 짜릿한 승리감", type: "T", micro: "승자의 희열 🔎" },
        { text: "상제방의 기분이 나쁘진 않을까 걱정됨", type: "F", micro: "배려의 우려 👂" }
      ]
    },
    {
      q: "사람을 신뢰하는 가장 강력한 기준은?",
      options: [
        { text: "그가 가진 능력과 약속을 지키는 책임감", type: "T", micro: "능력의 신뢰 📋" },
        { text: "그가 가진 따뜻한 성품과 진실함", type: "F", micro: "마음의 신뢰 💎" }
      ]
    },
    {
      q: "이상적인 리더의 표본을 고른다면?",
      options: [
        { text: "목표를 향해 거침없이 나아가는 카리스마 리더", type: "T", micro: "추진력 🧭" },
        { text: "팀원의 마음을 어루만지는 부드러운 화합형 리더", type: "F", micro: "포용력 ✨" }
      ]
    },
    {
      q: "날카로운 비판을 들었을 때 내 태도는?",
      options: [
        { text: "그 내용이 맞다면 덤덤하게 받아들임", type: "T", micro: "수용 🔬" },
        { text: "충분히 아파하고 오랫동안 그 기억이 남음", type: "F", micro: "상처 🩹" }
      ]
    },
    {
      q: "내 실수를 깨달은 순간 내 머릿속은?",
      options: [
        { text: "어떻게 수습하는 게 가장 효과적일까?", type: "T", micro: "해결 🔧" },
        { text: "나를 믿던 사람들에게 정말 미안해...", type: "F", micro: "사과 🫂" }
      ]
    },
    {
      q: "업무에서 가장 스트레스받는 상황은?",
      options: [
        { text: "일 처리가 비효율적이고 멍청한 사람이 옆에 있을 때", type: "T", micro: "비효율 🎯" },
        { text: "사람들끼리 파벌을 나누고 서로 비난할 때", type: "F", micro: "불화 🌱" }
      ]
    },
    {
      q: "회사의 불합리한 규정을 발견하면 나는?",
      options: [
        { text: "근거를 수집해 논리적으로 따지고 시정을 요구함", type: "T", micro: "개선 🔩" },
        { text: "다들 참는 분위기라면 굳이 옥죄고 싶지 않음", type: "F", micro: "순응 🕊️" }
      ]
    },

    /* ── forced_choice ── */
    {
      q: "나를 더 잘 나타내는 문구는?",
      options: [
        { text: "옳은 것은 언제나 옳아야 한다", type: "T", micro: "절대적 진실 🔧" },
        { text: "좋은 것은 언제나 좋아야 한다", type: "F", micro: "절대적 선의 💫" }
      ]
    },
    {
      q: "더 자연스러운 내 반응은?",
      options: [
        { text: "정확한 팩트 체크가 우선", type: "T", micro: "객관 🔍" },
        { text: "따뜻한 공감 반응이 우선", type: "F", micro: "주관 👥" }
      ]
    },
    {
      q: "내가 더 신뢰하는 판단의 도구는?",
      options: [
        { text: "차분하게 정리된 데이터와 논리", type: "T", micro: "데이터 🧊" },
        { text: "온몸으로 느껴지는 강렬한 직감과 감정", type: "F", micro: "리듬 💛" }
      ]
    },
    {
      q: "세상을 움직이는 더 큰 힘은?",
      options: [
        { text: "합리적인 사고와 과학적인 기술", type: "T", micro: "이성 ⚖️" },
        { text: "서로를 향한 사랑과 헌신적인 희생", type: "F", micro: "감성 🌊" }
      ]
    },
    {
      q: "나랑 더 가까운 스타일은?",
      options: [
        { text: "팩트로 뼈 때리는 솔직한 사람", type: "T", micro: "솔직함 🏳️" },
        { text: "상처 안 주려 끝까지 노력하는 따뜻한 사람", type: "F", micro: "자상함 💞" }
      ]
    },
    {
      q: "더 와닿는 응원 한 마디는?",
      options: [
        { text: "너의 능력이라면 충분히 할 수 있어!", type: "T", micro: "능력 인정 💊" },
        { text: "난 항상 네 편인 거 알지? 너만 믿어!", type: "F", micro: "정서 지지 🌟" }
      ]
    },
    {
      q: "내가 더 견디기 힘든 것은?",
      options: [
        { text: "말투는 친절한데 일 열나게 못 하는 사람", type: "T", micro: "무능력 💡" },
        { text: "일은 기가 막히게 잘하는데 말투가 개차반인 사람", type: "F", micro: "무례함 🌸" }
      ]
    },
    {
      q: "더 자연스러운 나의 행동은?",
      options: [
        { text: "틀린 걸 보면 정정해주지 않고는 못 배김", type: "T", micro: "교정 ✂️" },
        { text: "분위기가 깨질 것 같으면 틀려도 참음", type: "F", micro: "인내 🎭" }
      ]
    },

    /* ── consistency ── */
    {
      q: "중요한 갈림길에서 내 선택은?",
      options: [
        { text: "머리로 계산해보고 더 유리한 쪽", type: "T", micro: "지능 📊" },
        { text: "가슴이 시키는 대로 더 설레는 쪽", type: "F", micro: "직관 🧲" }
      ]
    },
    {
      q: "피드백을 들을 때 내 태도는?",
      options: [
        { text: "내가 어디를 어떻게 고쳐야 할지 더 궁금함", type: "T", micro: "정확성 🔑" },
        { text: "그 사람이 나를 어떻게 생각하는지 더 궁금함", type: "F", micro: "애착 🌱" }
      ]
    },
    {
      q: "팀원들과 사이가 안 좋을 때 일 효율은?",
      options: [
        { text: "사이가 안 좋아도 일은 일이니까 상관없음", type: "T", micro: "공사 구분 ⚙️" },
        { text: "사이가 안 좋으면 기빨려서 일도 안 됨", type: "F", micro: "공사 일체 🌟" }
      ]
    },

    /* ── state ── */
    {
      q: "지금 내 마음의 온도는?",
      options: [
        { text: "차갑고 명석한 얼음물 상태", type: "T", micro: "차가움 🔬" },
        { text: "따뜻하고 몽글몽글한 온수 상태", type: "F", micro: "따뜻함 🍵" }
      ]
    },
    {
      q: "오늘 나에게 더 필요한 비타민은?",
      options: [
        { text: "성공과 성취의 쾌감", type: "T", micro: "도파민 📋" },
        { text: "사랑과 소통의 편안함", type: "F", micro: "옥시토신 🫂" }
      ]
    },

    /* ── parallel ── */
    {
      q: "친구의 연애 고민을 들어줄 때 나는?",
      options: [
        { text: "그 연인의 행동이 왜 나쁜지 논리적으로 분석해줌", type: "T", micro: "해결사 🔧" },
        { text: "친구의 마음이 얼마나 아플지 같이 울며 들어줌", type: "F", micro: "동조자 🌊" }
      ]
    },
    {
      q: "내가 더 못 견디는 TV 프로그램은?",
      options: [
        { text: "논리도 없고 개연성도 억망인 막장 드라마", type: "T", micro: "부정 ⚖️" },
        { text: "서로 배신하고 상처 주는 가혹한 서바이벌", type: "F", micro: "비참 🌿" }
      ]
    },
    {
      q: "선물을 받을 때 가장 감동하는 부분은?",
      options: [
        { text: "와, 이게 마침 내가 필요했던 건데!", type: "T", micro: "실속 🎁" },
        { text: "와, 나를 위해서 이렇게 정성껏 골랐다니!", type: "F", micro: "정성 💝" }
      ]
    },
    {
      q: "게임을 할 때 내 목표는?",
      options: [
        { text: "최강의 공략으로 무조건 승리하는 것", type: "T", micro: "승리 🏆" },
        { text: "사람들과 어울리며 즐거운 추억을 쌓는 것", type: "F", micro: "즐거움 🎮" }
      ]
    },
    {
      q: "내가 칭찬할 때의 기준은?",
      options: [
        { text: "실제 성과물이 내 기준에 부합할 때", type: "T", micro: "완성도 📌" },
        { text: "그 사람의 수고와 노력이 가상할 때", type: "F", micro: "상대성 😊" }
      ]
    },
    {
      q: "오해받은 상황에서 나의 첫 마디는?",
      options: [
        { text: "그건 사실이 아니야. 당시 상황은 이랬어.", type: "T", micro: "입증 📐" },
        { text: "어떻게 나를 그렇게 생각할 수 있어? 서운해.", type: "F", micro: "토로 🌡️" }
      ]
    }
  ],

  JP: [
    /* ── anchor ── */
    {
      q: "새 학기나 새 직장 첫 날 전날 밤, 내 모습은?",
      options: [
        { text: "준비물 다 챙기고 내일 일정표까지 머릿속에 저장 완료", type: "J", micro: "안도감 📋" },
        { text: "가서 무슨 재미있는 일이 생길까 설레며 그냥 잠", type: "P", micro: "기대감 🌱" }
      ]
    },
    {
      q: "마감이 임박한 과제나 업무가 있을 때 내 상태는?",
      options: [
        { text: "이미 거의 끝내놓고 마지막 검토하며 여유 부림", type: "J", micro: "여유 ✅" },
        { text: "마감이 닥쳐와야 뇌 가동률이 100%가 됨", type: "P", micro: "폭발력 ⚡" }
      ]
    },
    {
      q: "내 삶의 철칙 한 마디는?",
      options: [
        { text: "오늘 할 일을 내일로 미루지 말자", type: "J", micro: "성실 🕰️" },
        { text: "내일의 나를 위해 오늘의 나를 아끼자", type: "P", micro: "유연 🌊" }
      ]
    },
    {
      q: "여러 가지 일을 동시에 처리해야 할 때?",
      options: [
        { text: "우선순위 리스트를 만들고 하나씩 지워나감", type: "J", micro: "질서 📌" },
        { text: "그중 제일 재미있어 보이는 것부터 손댐", type: "P", micro: "흐름 🌀" }
      ]
    },
    {
      q: "약속 시간 1시간 전, 약속 상대가 못 온다고 연락하면?",
      options: [
        { text: "내 일정이 싹 다 꼬인 느낌이라 좀 허무함", type: "J", micro: "균열 😤" },
        { text: "오예! 프리 타임 생겼다! 뭐하고 놀지 고민함", type: "P", micro: "자유 🧩" }
      ]
    },
    {
      q: "방 정리 습관을 보면 나랑 더 가까운 건?",
      options: [
        { text: "각 물건마다 지정석이 있어야 함", type: "J", micro: "정좌 📅" },
        { text: "손에 잡히는 곳에 있어야 편함. 정리는 가끔 몰아서", type: "P", micro: "방랑 🌊" }
      ]
    },
    {
      q: "미래를 대비하는 내 태도는?",
      options: [
        { text: "최악의 상황을 대비해 플랜B까지 늘 준비함", type: "J", micro: "대비 📐" },
        { text: "상황이 닥치면 내 순발력을 믿고 헤쳐 나감", type: "P", micro: "적응 🌿" }
      ]
    },

    /* ── discriminator ── */
    {
      q: "내가 더 좋아하는 작업 방식은?",
      options: [
        { text: "정해진 가이드라인과 매뉴얼이 있는 작업", type: "J", micro: "정석 🎯" },
        { text: "내가 직접 규칙을 만들어가는 자유로운 작업", type: "P", micro: "즉흥 🔥" }
      ]
    },
    {
      q: "식당 예약에 대한 내 생각은?",
      options: [
        { text: "유명한 곳이면 최소 일주일 전엔 예약해야 함", type: "J", micro: "완비 🕐" },
        { text: "가보고 자리 없으면 다른 데 가면 되지 뭐", type: "P", micro: "무계획 🏃" }
      ]
    },
    {
      q: "손님이 찾아온다고 할 때 내 준비는?",
      options: [
        { text: "이미 며칠 전부터 쓸고 닦고 준비 완료", type: "J", micro: "완성 🏠" },
        { text: "오기 10분 전부터 폭풍같이 짐 치움", type: "P", micro: "기적 👐" }
      ]
    },
    {
      q: "중요한 이메일을 보낼 때 나의 모습은?",
      options: [
        { text: "두 번 세 번 읽어보고 오타 없는지 철저히 확인", type: "J", micro: "검수 🔍" },
        { text: "핵심 내용 다 적었으면 쿨하게 발송", type: "P", micro: "발송 🔄" }
      ]
    },
    {
      q: "미완료된 과업을 남겨두고 잠자리에 들 때?",
      options: [
        { text: "머릿속에서 자꾸 떠올라서 은근히 스트레스받음", type: "J", micro: "찜찜 😰" },
        { text: "내일의 내가 해결하겠지... 꿀잠 가능", type: "P", micro: "안식 🛋️" }
      ]
    },
    {
      q: "메뉴 고르는 속도는?",
      options: [
        { text: "미리 먹고 싶은 걸 정해두거나 고심해서 고름", type: "J", micro: "신중 🔎" },
        { text: "그냥 눈에 띄는 첫 번째 메뉴로 픽", type: "P", micro: "과감 🎲" }
      ]
    },
    {
      q: "내가 더 못 견디는 환경은?",
      options: [
        { text: "계속해서 계획이 바뀌는 예측 불가한 상황", type: "J", micro: "혼란 🧩" },
        { text: "융통성 1도 없이 꽉 막힌 답답한 상황", type: "P", micro: "박제 ✨" }
      ]
    },
    {
      q: "쇼핑 목록에 대한 나의 태도는?",
      options: [
        { text: "딱 정해온 것만 사고 다른 건 안 쳐다봄", type: "J", micro: "효율 🛒" },
        { text: "돌아다니다 예쁜 거 있으면 나도 모르게 장바구니에 담음", type: "P", micro: "지름 💸" }
      ]
    },
    {
      q: "약속 시간 정할 때 나는?",
      options: [
        { text: "오후 2시 정각, 강남역 11번 출구!", type: "J", micro: "정밀 📌" },
        { text: "오후쯤 강남 쪽에서 볼까?", type: "P", micro: "모호 🌊" }
      ]
    },
    {
      q: "정보가 부족한 상황에서 결승점을 끊어야 한다면?",
      options: [
        { text: "더 확실해질 때까지 자료를 더 찾아봄", type: "J", micro: "객관 📊" },
        { text: "일단 내 감을 믿고 질러봄", type: "P", micro: "주관 🎯" }
      ]
    },

    /* ── forced_choice ── */
    {
      q: "나랑 더 어울리는 성격은?",
      options: [
        { text: "맺고 끊음이 확실한 결단력 있는 사람", type: "J", micro: "결단 🏃" },
        { text: "여러 가능성을 열어두는 유연한 사람", type: "P", micro: "유연 🌀" }
      ]
    },
    {
      q: "내가 느끼는 최고의 스트레스 원인은?",
      options: [
        { text: "예상치 못한 돌발 상황", type: "J", micro: "강박 😰" },
        { text: "자유를 억압하는 꽉 짜인 일정", type: "P", micro: "속박 🚧" }
      ]
    },
    {
      q: "나는 언제 안정감을 느끼나요?",
      options: [
        { text: "주변 환경이 내 통제 안에 있을 때", type: "J", micro: "통제 ✅" },
        { text: "상황에 따라 내 마음대로 바꿀 수 있을 때", type: "P", micro: "자립 🌈" }
      ]
    },
    {
      q: "어느 쪽이 더 나다운가요?",
      options: [
        { text: "정해진 틀 안에서 자유로운 사람", type: "J", micro: "형식 🔒" },
        { text: "틀 자체가 없는 자유로운 사람", type: "P", micro: "무형 🗝️" }
      ]
    },
    {
      q: "성취감에 대한 나의 정의는?",
      options: [
        { text: "끝까지 완수해서 마침표를 찍었을 때", type: "J", micro: "완결 🔐" },
        { text: "어떠한 가능성을 새로 열었을 때", type: "P", micro: "개방 🚀" }
      ]
    },
    {
      q: "나의 작업 스타일은?",
      options: [
        { text: "순서대로 하나씩 해나가는 순차 방식", type: "J", micro: "직렬 📦" },
        { text: "이것저것 동시에 건드려 보는 병렬 방식", type: "P", micro: "병렬 🌊" }
      ]
    },
    {
      q: "내 삶의 만족도는 언제 가장 높나요?",
      options: [
        { text: "모든 것이 계획한 대로 척척 맞물릴 때", type: "J", micro: "조화 📐" },
        { text: "예상 못한 보너스 같은 일이 생길 때", type: "P", micro: "우연 🎉" }
      ]
    },
    {
      q: "새로운 한 달을 시작하며 드는 생각은?",
      options: [
        { text: "이번 달은 어떤 목표를 달성해 볼까?", type: "J", micro: "목표 📅" },
        { text: "이번 달은 어떤 재미있는 일이 생길까?", type: "P", micro: "탐험 🧭" }
      ]
    },

    /* ── consistency ── */
    {
      q: "무기력할 때 나를 다시 일으켜 세우는 건?",
      options: [
        { text: "일단 씻고 나가서 할 일 하나부터 처리하기", type: "J", micro: "미션 🧩" },
        { text: "푹 쉬면서 하고 싶은 게 생길 때까지 기다리기", type: "P", micro: "직관 🎨" }
      ]
    },
    {
      q: "내 사전에 '충실함'이란?",
      options: [
        { text: "주어진 책임을 끝까지 완수하는 것", type: "J", micro: "책임 🗂️" },
        { text: "매 순간 내 마음의 소리에 충실한 것", type: "P", micro: "변주 🌪️" }
      ]
    },
    {
      q: "미룬 일에 침잠하는 나의 태도는?",
      options: [
        { text: "죄책감에 시달리지만 결국 꾸역꾸역 해냄", type: "J", micro: "강박 🏋️" },
        { text: "그럴 수도 있지... 기분이 좋아지면 그때 함", type: "P", micro: "긍정 ♟️" }
      ]
    },

    /* ── state ── */
    {
      q: "지금 이 순간 내 소망은?",
      options: [
        { text: "어지러운 내 일상을 깔끔하게 정리하고 싶음", type: "J", micro: "정리 📋" },
        { text: "어디론가 훌쩍 계획 없이 떠나고 싶음", type: "P", micro: "방랑 🌊" }
      ]
    },
    {
      q: "오늘 내 에너지를 어디에 쓰고 싶나요?",
      options: [
        { text: "꽉 짜인 스케줄대로 완벽한 하루 보내기", type: "J", micro: "완벽 ✅" },
        { text: "아무것도 안 해도 좋으니 내키는 대로 보내기", type: "P", micro: "자유 🌟" }
      ]
    },

    /* ── parallel ── */
    {
      q: "새 학기 필기구를 살 때 나의 기준은?",
      options: [
        { text: "꼭 필요한 것들만 추려서 리스트대로 삼", type: "J", micro: "실무 🎒" },
        { text: "예쁘고 신기한 거 있으면 일단 집어봄", type: "P", micro: "흥미 🚀" }
      ]
    },
    {
      q: "갑자기 영화 볼 시간이 생겼다!",
      options: [
        { text: "이미 찜해둔 위시리스트 중 하나를 봄", type: "J", micro: "계획 📌" },
        { text: "그냥 인기 차트 보고 끌리는 걸로 클릭", type: "P", micro: "즉흥 🎲" }
      ]
    },
    {
      q: "조별 과제에서 내가 맡고 싶은 역할은?",
      options: [
        { text: "일정과 마감을 총괄하며 조율하는 역할", type: "J", micro: "리더 📐" },
        { text: "좋은 아이디어가 생기면 그때그때 보태는 역할", type: "P", micro: "조커 🌊" }
      ]
    },
    {
      q: "데이트의 정석을 고른다면?",
      options: [
        { text: "식당 예약은 필수! 동선까지 짜놓은 데이트", type: "J", micro: "정석 🗓️" },
        { text: "일단 만나서 가고 싶은 곳으로 발길 닿는 데이트", type: "P", micro: "낭만 🌸" }
      ]
    },
    {
      q: "휴대폰 첫 화면 앱 배치는?",
      options: [
        { text: "폴더별로 깔끔하게 정리되어 있음", type: "J", micro: "질서 🔔" },
        { text: "그냥 다운로드받은 순서대로 흩어져 있음", type: "P", micro: "카오스 📭" }
      ]
    },
    {
      q: "여행 계획 세우는 자체를 좋아하는 편인가요?",
      options: [
        { text: "여행 가서 고생 안 하려고 꼼꼼히 짜는 게 즐거움", type: "J", micro: "준비 🗺️" },
        { text: "계획 세우는 건 귀찮고 가서 노는 게 더 좋음", type: "P", micro: "실전 🌍" }
      ]
    }
  ],

  /* ── Metadata restored ── */
  _META: {
    EI: [
      { id: "EI_019", familyId: "EI_FRI_WORK_EXIT", role: "anchor", weight: 1.4 },
      { id: "EI_020", familyId: "EI_SELF_INTRO", role: "anchor", weight: 1.4 },
      { id: "EI_021", familyId: "EI_TROUBLE_SOLVE", role: "anchor", weight: 1.4 },
      { id: "EI_022", familyId: "EI_HARD_DECIDE", role: "anchor", weight: 1.4 },
      { id: "EI_023", familyId: "EI_MEET_VIBE", role: "anchor", weight: 1.4 },
      { id: "EI_024", familyId: "EI_CHAT_DIFFER", role: "anchor", weight: 1.4 },
      { id: "EI_025", familyId: "EI_CALL_PREF", role: "anchor", weight: 1.4 },
      { id: "EI_026", familyId: "EI_SIDE_BY_SIDE", role: "discriminator", weight: 1.1 },
      { id: "EI_027", familyId: "EI_STUDY_VIBE", role: "discriminator", weight: 1.1 },
      { id: "EI_028", familyId: "EI_FIGHT_AFTER", role: "discriminator", weight: 1.1 },
      { id: "EI_029", familyId: "EI_PARTY_STRANGE", role: "discriminator", weight: 1.1 },
      { id: "EI_030", familyId: "EI_CREATIVE_MOMENT", role: "discriminator", weight: 1.1 },
      { id: "EI_031", familyId: "EI_WORK_INTERRUPT", role: "discriminator", weight: 1.1 },
      { id: "EI_032", familyId: "EI_HARD_DAY_NEED", role: "discriminator", weight: 1.1 },
      { id: "EI_033", familyId: "EI_TEAM_VS_SOLO", role: "discriminator", weight: 1.1 },
      { id: "EI_034", familyId: "EI_TRAVEL_JOY", role: "discriminator", weight: 1.1 },
      { id: "EI_035", familyId: "EI_EMPTY_NIGHT", role: "discriminator", weight: 1.1 },
      { id: "EI_036", familyId: "EI_FC_NOISY_SILENT", role: "forced_choice", weight: 1.2 },
      { id: "EI_037", familyId: "EI_FC_SPEAK_THINK", role: "forced_choice", weight: 1.2 },
      { id: "EI_038", familyId: "EI_FC_ENERGY_SRC", role: "forced_choice", weight: 1.2 },
      { id: "EI_039", familyId: "EI_FC_WEEKEND_VIBE", role: "forced_choice", weight: 1.2 },
      { id: "EI_040", familyId: "EI_FC_AWKWARD_SILENCE", role: "forced_choice", weight: 1.2 },
      { id: "EI_041", familyId: "EI_FC_BDAY_PARTY", role: "forced_choice", weight: 1.2 },
      { id: "EI_042", familyId: "EI_FC_FRIEND_TIME", role: "forced_choice", weight: 1.2 },
      { id: "EI_043", familyId: "EI_FC_EATING_STYLE", role: "forced_choice", weight: 1.2 },
      { id: "EI_044", familyId: "EI_REAL_REST", role: "consistency", weight: 1.0 },
      { id: "EI_045", familyId: "EI_MORNING_AFTER", role: "consistency", weight: 1.0 },
      { id: "EI_046", familyId: "EI_AWKWARD_STAY", role: "consistency", weight: 1.0 },
      { id: "EI_047", familyId: "EI_NOW_NEED", role: "state", weight: 0.8 },
      { id: "EI_048", familyId: "EI_TODAY_COLOR", role: "state", weight: 0.8 },
      { id: "EI_049", familyId: "EI_HOLIDAY_REACH", role: "parallel", weight: 1.0 },
      { id: "EI_050", familyId: "EI_SAD_COMFORT", role: "parallel", weight: 1.0 },
      { id: "EI_051", familyId: "EI_SUDDEN_STAGE", role: "parallel", weight: 1.0 },
      { id: "EI_052", familyId: "EI_BDAY_CHOICE", role: "parallel", weight: 1.0 },
      { id: "EI_053", familyId: "EI_SUN_MORNING", role: "parallel", weight: 1.0 },
      { id: "EI_054", familyId: "EI_STRANGER_INIT", role: "parallel", weight: 1.0 }
    ],
    SN: [
      { id: "SN_019", familyId: "SN_ALGO_POINT", role: "anchor", weight: 1.4 },
      { id: "SN_020", familyId: "SN_BIZ_IDEA", role: "anchor", weight: 1.4 },
      { id: "SN_021", familyId: "SN_STORY_STYLE", role: "anchor", weight: 1.4 },
      { id: "SN_022", familyId: "SN_LEARN_PREF", role: "anchor", weight: 1.4 },
      { id: "SN_023", familyId: "SN_EXHIBIT_FOCUS", role: "anchor", weight: 1.4 },
      { id: "SN_024", familyId: "SN_FUTURE_ME", role: "anchor", weight: 1.4 },
      { id: "SN_025", familyId: "SN_MEMBER_TOPIC", role: "anchor", weight: 1.4 },
      { id: "SN_026", familyId: "SN_MAP_TRUST", role: "discriminator", weight: 1.1 },
      { id: "SN_027", familyId: "SN_MOVIE_END", role: "discriminator", weight: 1.1 },
      { id: "SN_028", familyId: "SN_KNOW_POINT", role: "discriminator", weight: 1.1 },
      { id: "SN_029", familyId: "SN_PHOTO_ALBUM", role: "discriminator", weight: 1.1 },
      { id: "SN_030", familyId: "SN_STUDY_SRC", role: "discriminator", weight: 1.1 },
      { id: "SN_031", familyId: "SN_INFO_DELIVER", role: "discriminator", weight: 1.1 },
      { id: "SN_032", familyId: "SN_HOBBY_GOAL", role: "discriminator", weight: 1.1 },
      { id: "SN_033", familyId: "SN_CAFE_EYE", role: "discriminator", weight: 1.1 },
      { id: "SN_034", familyId: "SN_NATURE_THOUGHT", role: "discriminator", weight: 1.1 },
      { id: "SN_035", familyId: "SN_MEM_FIELD", role: "discriminator", weight: 1.1 },
      { id: "SN_036", familyId: "SN_FC_DO_VS_LEARN", role: "forced_choice", weight: 1.2 },
      { id: "SN_037", familyId: "SN_FC_OLD_VS_NEW", role: "forced_choice", weight: 1.2 },
      { id: "SN_038", familyId: "SN_FC_LIFE_PHIL", role: "forced_choice", weight: 1.2 },
      { id: "SN_039", familyId: "SN_FC_PULL_WORD", role: "forced_choice", weight: 1.2 },
      { id: "SN_040", familyId: "SN_FC_INFO_ORDER", role: "forced_choice", weight: 1.2 },
      { id: "SN_041", familyId: "SN_FC_PROCESS_ORDER", role: "forced_choice", weight: 1.2 },
      { id: "SN_042", familyId: "SN_FC_STORY_TYPE", role: "forced_choice", weight: 1.2 },
      { id: "SN_043", familyId: "SN_FC_ORIGIN", role: "forced_choice", weight: 1.2 },
      { id: "SN_044", familyId: "SN_NEW_MECH", role: "consistency", weight: 1.0 },
      { id: "SN_045", familyId: "SN_NEWS_REACT", role: "consistency", weight: 1.0 },
      { id: "SN_046", familyId: "SN_SMART_FEEL", role: "consistency", weight: 1.0 },
      { id: "SN_047", familyId: "SN_NOW_RATIO", role: "state", weight: 0.8 },
      { id: "SN_048", familyId: "SN_TODAY_EXCITE", role: "state", weight: 0.8 },
      { id: "SN_049", familyId: "SN_SNS_STYLE", role: "parallel", weight: 1.0 },
      { id: "SN_050", familyId: "SN_MEMO_STYLE", role: "parallel", weight: 1.0 },
      { id: "SN_051", familyId: "SN_NO_MAP", role: "parallel", weight: 1.0 },
      { id: "SN_052", familyId: "SN_TRAVEL_INFO", role: "parallel", weight: 1.0 },
      { id: "SN_053", familyId: "SN_GAME_STYLE", role: "parallel", weight: 1.0 },
      { id: "SN_054", familyId: "SN_MUSIC_POINT", role: "parallel", weight: 1.0 }
    ],
    TF: [
      { id: "TF_019", familyId: "TF_OH_MY_GOD", role: "anchor", weight: 1.4 },
      { id: "TF_020", familyId: "TF_FINAL_DECIDE", role: "anchor", weight: 1.4 },
      { id: "TF_021", familyId: "TF_FRI_WRONG", role: "anchor", weight: 1.4 },
      { id: "TF_022", familyId: "TF_TEAM_EVAL", role: "anchor", weight: 1.4 },
      { id: "TF_023", familyId: "TF_ANGRY_WHY", role: "anchor", weight: 1.4 },
      { id: "TF_024", familyId: "TF_CONSULT_WANT", role: "anchor", weight: 1.4 },
      { id: "TF_025", familyId: "TF_PRAISE_HOW", role: "anchor", weight: 1.4 },
      { id: "TF_026", familyId: "TF_FIGHT_TEAR", role: "discriminator", weight: 1.1 },
      { id: "TF_027", familyId: "TF_JUSTICE_DEF", role: "discriminator", weight: 1.1 },
      { id: "TF_028", familyId: "TF_FRI_MISTAKE", role: "discriminator", weight: 1.1 },
      { id: "TF_029", familyId: "TF_WIN_FEEL", role: "discriminator", weight: 1.1 },
      { id: "TF_030", familyId: "TF_TRUST_SRC", role: "discriminator", weight: 1.1 },
      { id: "TF_031", familyId: "TF_LEADER_TYPE", role: "discriminator", weight: 1.1 },
      { id: "TF_032", familyId: "TF_CRITIC_REACT", role: "discriminator", weight: 1.1 },
      { id: "TF_033", familyId: "TF_ERROR_HEAD", role: "discriminator", weight: 1.1 },
      { id: "TF_034", familyId: "TF_STRESS_SRC", role: "discriminator", weight: 1.1 },
      { id: "TF_035", familyId: "TF_RULE_FIGHT", role: "discriminator", weight: 1.1 },
      { id: "TF_036", familyId: "TF_FC_RIGHT_GOOD", role: "forced_choice", weight: 1.2 },
      { id: "TF_037", familyId: "TF_FC_FACT_EMOTION", role: "forced_choice", weight: 1.2 },
      { id: "TF_038", familyId: "TF_FC_DATA_FEEL", role: "forced_choice", weight: 1.2 },
      { id: "TF_039", familyId: "TF_FC_WORLD_POWER", role: "forced_choice", weight: 1.2 },
      { id: "TF_040", familyId: "TF_FC_BONE_VS_HEART", role: "forced_choice", weight: 1.2 },
      { id: "TF_041", familyId: "TF_FC_CHEER_UP", role: "forced_choice", weight: 1.2 },
      { id: "TF_042", familyId: "TF_FC_INCAPABLE_RUDE", role: "forced_choice", weight: 1.2 },
      { id: "TF_043", familyId: "TF_FC_CORRECT_STAY", role: "forced_choice", weight: 1.2 },
      { id: "TF_044", familyId: "TF_WAY_CHOOSE", role: "consistency", weight: 1.0 },
      { id: "TF_045", familyId: "TF_FEEDBACK_STYLE", role: "consistency", weight: 1.0 },
      { id: "TF_046", familyId: "TF_TEAM_BAD_REL", role: "consistency", weight: 1.0 },
      { id: "TF_047", familyId: "TF_HEART_TEMP", role: "state", weight: 0.8 },
      { id: "TF_048", familyId: "TF_VITAMIN_WANT", role: "state", weight: 0.8 },
      { id: "TF_049", familyId: "TF_FRI_DRAMA", role: "parallel", weight: 1.0 },
      { id: "TF_050", familyId: "TF_TV_STRESS", role: "parallel", weight: 1.0 },
      { id: "TF_051", familyId: "TF_GIFT_POINT", role: "parallel", weight: 1.0 },
      { id: "TF_052", familyId: "TF_GAME_GOAL", role: "parallel", weight: 1.0 },
      { id: "TF_053", familyId: "TF_PRAISE_STD", role: "parallel", weight: 1.0 },
      { id: "TF_054", familyId: "TF_MISUNDERSTAND", role: "parallel", weight: 1.0 }
    ],
    JP: [
      { id: "JP_019", familyId: "JP_FIRST_DAY", role: "anchor", weight: 1.4 },
      { id: "JP_020", familyId: "JP_DEADLINE_STATE", role: "anchor", weight: 1.4 },
      { id: "JP_021", familyId: "JP_LIFE_MOTO", role: "anchor", weight: 1.4 },
      { id: "JP_022", familyId: "JP_MULTI_SOLVE", role: "anchor", weight: 1.4 },
      { id: "JP_023", familyId: "JP_CANCEL_REACT", role: "anchor", weight: 1.4 },
      { id: "JP_024", familyId: "JP_ROOM_SEAT", role: "anchor", weight: 1.4 },
      { id: "JP_025", familyId: "JP_FUTURE_PREP", role: "anchor", weight: 1.4 },
      { id: "JP_026", familyId: "JP_WORK_PREF", role: "discriminator", weight: 1.1 },
      { id: "JP_027", familyId: "JP_RESERVE_STYLE", role: "discriminator", weight: 1.1 },
      { id: "JP_028", familyId: "JP_GUEST_PREP", role: "discriminator", weight: 1.1 },
      { id: "JP_029", familyId: "JP_MAIL_CHECK", role: "discriminator", weight: 1.1 },
      { id: "JP_030", familyId: "JP_UNFINISHED_SLEEP", role: "discriminator", weight: 1.1 },
      { id: "JP_031", familyId: "JP_MENU_SPEED", role: "discriminator", weight: 1.1 },
      { id: "JP_032", familyId: "JP_HATE_ENV", role: "discriminator", weight: 1.1 },
      { id: "JP_033", familyId: "JP_SHOPPING_LIST", role: "discriminator", weight: 1.1 },
      { id: "JP_034", familyId: "JP_MEET_TIME", role: "discriminator", weight: 1.1 },
      { id: "JP_035", familyId: "JP_DECIDE_SPEED", role: "discriminator", weight: 1.1 },
      { id: "JP_036", familyId: "JP_FC_BOLD_VS_SOFT", role: "forced_choice", weight: 1.2 },
      { id: "JP_037", familyId: "JP_FC_STRESS_SRC", role: "forced_choice", weight: 1.2 },
      { id: "JP_038", familyId: "JP_FC_STABLE_VIBE", role: "forced_choice", weight: 1.2 },
      { id: "JP_039", familyId: "JP_FC_NA_DOWN", role: "forced_choice", weight: 1.2 },
      { id: "JP_040", familyId: "JP_FC_SUCCESS_DEF", role: "forced_choice", weight: 1.2 },
      { id: "JP_041", familyId: "JP_FC_PROCESS_STYLE", role: "forced_choice", weight: 1.2 },
      { id: "JP_042", familyId: "JP_FC_LIFE_SATIS", role: "forced_choice", weight: 1.2 },
      { id: "JP_043", familyId: "JP_FC_NEW_MONTH", role: "forced_choice", weight: 1.2 },
      { id: "JP_044", familyId: "JP_HELPLESS_INIT", role: "consistency", weight: 1.0 },
      { id: "JP_045", familyId: "JP_FAITHFUL_DEF", role: "consistency", weight: 1.0 },
      { id: "JP_046", familyId: "JP_DELAYED_WORK", role: "consistency", weight: 1.0 },
      { id: "JP_047", familyId: "JP_NOW_WISH", role: "state", weight: 0.8 },
      { id: "JP_048", familyId: "JP_TODAY_ENERGY", role: "state", weight: 0.8 },
      { id: "JP_049", familyId: "JP_NEW_STATIONERY", role: "parallel", weight: 1.0 },
      { id: "JP_050", familyId: "JP_SUDDEN_MOVIE", role: "parallel", weight: 1.0 },
      { id: "JP_051", familyId: "JP_PROJECT_ROLE", role: "parallel", weight: 1.0 },
      { id: "JP_052", familyId: "JP_DATE_STD", role: "parallel", weight: 1.0 },
      { id: "JP_053", familyId: "JP_HOME_SCREEN", role: "parallel", weight: 1.0 },
      { id: "JP_054", familyId: "JP_TRAVEL_PREP", role: "parallel", weight: 1.0 }
    ]
  }
};

// index.html의 handleStart 로직과 호환되도록 평탄화된 변수 추가 할당
export const QUESTIONS_META_EXTENDED = QUESTIONS_EXTENDED._META;

if (typeof window !== 'undefined') {
  window.QUESTIONS_EXTENDED = QUESTIONS_EXTENDED;
  window.QUESTIONS_META_EXTENDED = QUESTIONS_META_EXTENDED;
}
