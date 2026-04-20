export { QUESTIONS_META } from '../../questions_meta.js';
export {
  QUESTIONS_EXTENDED,
  QUESTIONS_META_EXTENDED
} from '../../questions_extended.js';

const FOLLOWUP_WEIGHT = 1.3;

export const FOLLOWUP_QUESTIONS = {
  EI: [
    {
      id: 'EI_FOLLOWUP_001',
      familyId: 'EI_followup_energy_after',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '사람들과 오래 어울린 뒤 집에 돌아오면, 진짜 내 상태는?',
      options: [
        { text: '기분이 더 살아나서 아직도 말할 힘이 남아 있음', type: 'E', micro: '사람 에너지가 아직 남아 있어요' },
        { text: '즐거웠어도 일단 혼자 조용히 있어야 충전됨', type: 'I', micro: '혼자만의 정리가 먼저 필요해요' }
      ]
    },
    {
      id: 'EI_FOLLOWUP_002',
      familyId: 'EI_followup_problem_solving',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '마음이 복잡할 때, 답을 더 빨리 찾게 되는 쪽은?',
      options: [
        { text: '누군가와 말로 풀어가며 생각을 정리할 때', type: 'E', micro: '말하면서 답이 보여요' },
        { text: '혼자 생각하고 정리한 뒤 결론을 낼 때', type: 'I', micro: '혼자일 때 판단이 또렷해져요' }
      ]
    },
    {
      id: 'EI_FOLLOWUP_003',
      familyId: 'EI_followup_empty_evening',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '갑자기 비어버린 저녁 시간이 생기면 더 끌리는 건?',
      options: [
        { text: '누구라도 만나서 밖으로 나가고 싶어짐', type: 'E', micro: '바깥으로 에너지가 움직여요' },
        { text: '드디어 혼자만의 시간을 쓸 수 있어 반가움', type: 'I', micro: '나만의 시간이 선물 같아요' }
      ]
    },
    {
      id: 'EI_FOLLOWUP_004',
      familyId: 'EI_followup_work_style',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '중요한 일을 몰입해서 해야 할 때 더 편한 방식은?',
      options: [
        { text: '옆에 사람 기척이 있거나 같이 움직이는 환경', type: 'E', micro: '함께하는 기운이 집중을 살려요' },
        { text: '완전히 방해받지 않는 혼자만의 환경', type: 'I', micro: '고요할수록 집중이 깊어져요' }
      ]
    },
    {
      id: 'EI_FOLLOWUP_005',
      familyId: 'EI_followup_first_reaction',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '처음 보는 사람이 많은 자리에서 더 자연스러운 첫 반응은?',
      options: [
        { text: '먼저 분위기를 파악하며 말을 붙여보는 편', type: 'E', micro: '사람 속으로 바로 들어가요' },
        { text: '일단 지켜보다 마음이 편해지면 천천히 가까워짐', type: 'I', micro: '천천히 워밍업하는 편이에요' }
      ]
    },
    {
      id: 'EI_FOLLOWUP_006',
      familyId: 'EI_followup_holiday',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '휴일을 가장 만족스럽게 보냈다고 느끼는 순간은?',
      options: [
        { text: '사람들과 시간을 꽉 채우고 돌아왔을 때', type: 'E', micro: '사람 속에서 만족감이 커져요' },
        { text: '혼자 조용히 보내고 기분 좋게 마무리했을 때', type: 'I', micro: '혼자 보낸 시간이 가장 잘 맞아요' }
      ]
    },
    {
      id: 'EI_FOLLOWUP_007',
      familyId: 'EI_followup_conflict',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '마음 상한 일이 생겼을 때 더 먼저 하는 건?',
      options: [
        { text: '바로 누군가에게 얘기하며 감정을 털어냄', type: 'E', micro: '감정은 대화로 풀려요' },
        { text: '혼자 시간을 두고 내 감정을 먼저 정리함', type: 'I', micro: '내 감정부터 정리하고 싶어요' }
      ]
    },
    {
      id: 'EI_FOLLOWUP_008',
      familyId: 'EI_followup_fun_source',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '요즘 내가 가장 빨리 기분 좋아지는 계기는?',
      options: [
        { text: '사람들과 부딪히며 분위기가 살아날 때', type: 'E', micro: '사람이 곧 활력소예요' },
        { text: '혼자 내 취향에 몰입할 시간을 가질 때', type: 'I', micro: '혼자일 때 진짜 편안해져요' }
      ]
    },
    {
      id: 'EI_FOLLOWUP_009',
      familyId: 'EI_followup_late_night',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '하루 종일 혼자 보내고 밤이 되면 더 드는 마음은?',
      options: [
        { text: '누군가와 조금이라도 연결되고 싶어짐', type: 'E', micro: '사람 쪽으로 에너지가 움직여요' },
        { text: '이 정도면 충분히 편해서 그대로 있고 싶음', type: 'I', micro: '혼자 있는 시간이 잘 맞아요' }
      ]
    },
    {
      id: 'EI_FOLLOWUP_010',
      familyId: 'EI_followup_idea_share',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '중요한 아이디어가 떠올랐을 때 더 먼저 하는 건?',
      options: [
        { text: '누군가에게 말해보며 반응을 보고 싶어짐', type: 'E', micro: '말하면서 생각이 살아나요' },
        { text: '혼자 더 다듬고 정리한 뒤 꺼내고 싶어짐', type: 'I', micro: '혼자 정리해야 또렷해져요' }
      ]
    }
  ],
  SN: [
    {
      id: 'SN_FOLLOWUP_001',
      familyId: 'SN_followup_description',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '새로운 장소를 설명할 때 더 먼저 나오는 건?',
      options: [
        { text: '어디에 뭐가 있었는지, 실제로 본 장면과 정보', type: 'S', micro: '보이는 정보가 먼저 남아요' },
        { text: '거기서 느낀 분위기나 떠오른 이미지, 의미', type: 'N', micro: '느낌과 해석이 먼저 떠올라요' }
      ]
    },
    {
      id: 'SN_FOLLOWUP_002',
      familyId: 'SN_followup_learning',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '새로운 걸 배울 때 더 잘 들어오는 방식은?',
      options: [
        { text: '예시와 실제 적용법을 볼 때', type: 'S', micro: '실제 예시가 있어야 편해요' },
        { text: '전체 개념과 가능성을 먼저 이해할 때', type: 'N', micro: '큰 그림이 먼저 잡혀야 해요' }
      ]
    },
    {
      id: 'SN_FOLLOWUP_003',
      familyId: 'SN_followup_memory',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '하루를 돌아볼 때 더 오래 남는 건?',
      options: [
        { text: '정확히 어떤 일이 있었는지의 장면과 순서', type: 'S', micro: '장면과 순서가 또렷해요' },
        { text: '그 하루가 내게 어떤 의미였는지의 느낌', type: 'N', micro: '의미와 여운이 더 남아요' }
      ]
    },
    {
      id: 'SN_FOLLOWUP_004',
      familyId: 'SN_followup_start_point',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '새 프로젝트를 시작할 때 먼저 보는 쪽은?',
      options: [
        { text: '지금 당장 가능한 현실적인 단계와 자료', type: 'S', micro: '실행 가능한 것부터 봐요' },
        { text: '이게 어디까지 확장될 수 있을지의 가능성', type: 'N', micro: '가능성이 먼저 눈에 들어와요' }
      ]
    },
    {
      id: 'SN_FOLLOWUP_005',
      familyId: 'SN_followup_story',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '영화나 책을 보고 나서 더 오래 생각나는 건?',
      options: [
        { text: '구체적인 장면, 대사, 디테일', type: 'S', micro: '디테일이 오래 남아요' },
        { text: '작품이 말하고 싶은 메시지와 상징', type: 'N', micro: '숨은 의미가 오래 남아요' }
      ]
    },
    {
      id: 'SN_FOLLOWUP_006',
      familyId: 'SN_followup_travel',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '여행 계획을 잡을 때 더 중요한 건?',
      options: [
        { text: '동선, 이동 시간, 실제로 갈 장소 정보', type: 'S', micro: '실제 계획이 중요해요' },
        { text: '그 여행에서 어떤 기분과 경험을 만들지', type: 'N', micro: '경험의 그림부터 그려요' }
      ]
    },
    {
      id: 'SN_FOLLOWUP_007',
      familyId: 'SN_followup_conversation',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '대화할 때 더 재밌어지는 순간은?',
      options: [
        { text: '실제 있었던 일과 생활 얘기가 오갈 때', type: 'S', micro: '현실 이야기에서 몰입돼요' },
        { text: '만약에, 왜, 의미 같은 얘기로 확장될 때', type: 'N', micro: '추상적인 얘기가 재밌어요' }
      ]
    },
    {
      id: 'SN_FOLLOWUP_008',
      familyId: 'SN_followup_choice',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '선택해야 할 게 많을 때 더 믿는 건?',
      options: [
        { text: '이미 검증된 경험과 구체적 정보', type: 'S', micro: '검증된 정보가 믿음직해요' },
        { text: '묘하게 끌리는 가능성과 직감', type: 'N', micro: '감이 올 때가 있어요' }
      ]
    },
    {
      id: 'SN_FOLLOWUP_009',
      familyId: 'SN_followup_first_question',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '처음 보는 설명을 들을 때 더 먼저 궁금한 건?',
      options: [
        { text: '그래서 실제로 어떻게 쓰고 적용하는지', type: 'S', micro: '실제 쓰임이 먼저 궁금해요' },
        { text: '왜 이런 원리로 돌아가는지의 배경', type: 'N', micro: '원리와 맥락이 먼저 궁금해요' }
      ]
    },
    {
      id: 'SN_FOLLOWUP_010',
      familyId: 'SN_followup_memory_bias',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '무언가를 기억할 때 더 오래 남는 건?',
      options: [
        { text: '장면, 정보, 실제로 있었던 디테일', type: 'S', micro: '디테일이 오래 남아요' },
        { text: '그때 느낀 의미, 분위기, 연결감', type: 'N', micro: '느낌과 의미가 오래 남아요' }
      ]
    }
  ],
  TF: [
    {
      id: 'TF_FOLLOWUP_001',
      familyId: 'TF_followup_feedback',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '친한 사람이 고민을 털어놓을 때 먼저 떠오르는 건?',
      options: [
        { text: '상황을 정리해서 현실적인 해결 방향을 말해주기', type: 'T', micro: '해결책이 먼저 보여요' },
        { text: '그 사람이 얼마나 힘들었을지 공감해주기', type: 'F', micro: '마음부터 살피게 돼요' }
      ]
    },
    {
      id: 'TF_FOLLOWUP_002',
      familyId: 'TF_followup_conflict_rule',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '의견 충돌이 생기면 더 중요하게 보는 건?',
      options: [
        { text: '누가 봐도 납득 가능한 기준과 논리', type: 'T', micro: '기준이 먼저 필요해요' },
        { text: '관계가 상하지 않도록 말의 온도 맞추기', type: 'F', micro: '분위기와 마음이 더 중요해요' }
      ]
    },
    {
      id: 'TF_FOLLOWUP_003',
      familyId: 'TF_followup_decision',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '결정을 빨리 내려야 할 때 더 믿는 건?',
      options: [
        { text: '객관적으로 더 타당한 선택인지', type: 'T', micro: '타당성이 우선이에요' },
        { text: '이 선택이 사람들에게 어떻게 느껴질지', type: 'F', micro: '사람 반응이 먼저 보여요' }
      ]
    },
    {
      id: 'TF_FOLLOWUP_004',
      familyId: 'TF_followup_team',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '팀에서 누군가 실수했을 때 내 기본 반응은?',
      options: [
        { text: '어디서 어긋났는지 바로 짚고 재발 방지부터 생각함', type: 'T', micro: '문제 구조를 먼저 봐요' },
        { text: '그 사람이 위축되지 않게 먼저 분위기를 살핌', type: 'F', micro: '사람 마음부터 신경 써요' }
      ]
    },
    {
      id: 'TF_FOLLOWUP_005',
      familyId: 'TF_followup_priority',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '칭찬이나 평가를 할 때 더 자연스러운 건?',
      options: [
        { text: '구체적으로 뭐가 잘됐는지 정확히 말해주는 것', type: 'T', micro: '정확한 피드백이 편해요' },
        { text: '상대가 기분 좋게 느끼도록 따뜻하게 말하는 것', type: 'F', micro: '기분 좋게 전달하고 싶어요' }
      ]
    },
    {
      id: 'TF_FOLLOWUP_006',
      familyId: 'TF_followup_friend',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '친구가 비합리적인 선택을 하려 할 때 더 먼저 나오는 건?',
      options: [
        { text: '왜 그 선택이 위험한지 논리적으로 설명함', type: 'T', micro: '설득 포인트를 찾게 돼요' },
        { text: '그 마음을 이해해주면서 조심스럽게 말함', type: 'F', micro: '감정을 건드리지 않으려 해요' }
      ]
    },
    {
      id: 'TF_FOLLOWUP_007',
      familyId: 'TF_followup_worktone',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '일할 때 스스로 가장 만족스러운 순간은?',
      options: [
        { text: '명확하게 정리되고 성과가 딱 보일 때', type: 'T', micro: '정리된 결과가 만족스러워요' },
        { text: '같이 일한 사람들이 편안해하고 분위기가 좋을 때', type: 'F', micro: '함께한 느낌이 중요해요' }
      ]
    },
    {
      id: 'TF_FOLLOWUP_008',
      familyId: 'TF_followup_toughtruth',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '꼭 해야 하는 말이 상처가 될 수 있다면?',
      options: [
        { text: '필요하다면 불편해도 핵심을 분명히 말함', type: 'T', micro: '필요한 말은 해야 한다고 봐요' },
        { text: '내용보다 전달 방식과 타이밍을 더 고민함', type: 'F', micro: '어떻게 말할지가 더 중요해요' }
      ]
    },
    {
      id: 'TF_FOLLOWUP_009',
      familyId: 'TF_followup_honesty_balance',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '친한 사람에게 솔직한 말을 해야 할 때 더 우선하는 건?',
      options: [
        { text: '핵심을 정확히 말해주는 것', type: 'T', micro: '정확한 말이 우선이에요' },
        { text: '상처를 덜 받게 말해주는 것', type: 'F', micro: '말의 온도를 먼저 보게 돼요' }
      ]
    },
    {
      id: 'TF_FOLLOWUP_010',
      familyId: 'TF_followup_problem_sort',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '문제가 터졌을 때 먼저 정리하는 건?',
      options: [
        { text: '원인과 해결 순서', type: 'T', micro: '구조부터 정리하고 싶어요' },
        { text: '사람들 감정과 관계의 흐름', type: 'F', micro: '사람 마음부터 살피고 싶어요' }
      ]
    },
    {
      id: 'TF_FOLLOWUP_011',
      familyId: 'TF_followup_expectation_gap',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '누군가 기대에 못 미쳤을 때 더 먼저 드는 말은?',
      options: [
        { text: '어디부터 고치면 좋을지 같이 보자', type: 'T', micro: '개선 포인트가 먼저 떠올라요' },
        { text: '많이 부담됐겠다, 일단 괜찮아', type: 'F', micro: '마음을 먼저 안정시키고 싶어요' }
      ]
    },
    {
      id: 'TF_FOLLOWUP_012',
      familyId: 'TF_followup_regret_reason',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '결정을 내리고 후회가 남는 이유는 대체로?',
      options: [
        { text: '논리적으로 더 나은 선택이 있었던 것 같아서', type: 'T', micro: '타당성이 계속 남아요' },
        { text: '누군가 마음 상했을까 계속 걸려서', type: 'F', micro: '사람 마음이 오래 남아요' }
      ]
    }
  ],
  JP: [
    {
      id: 'JP_FOLLOWUP_001',
      familyId: 'JP_followup_plan_change',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '준비해둔 계획이 갑자기 바뀌면 내 기본 반응은?',
      options: [
        { text: '일단 다시 정리해서 새로운 계획을 세우고 싶음', type: 'J', micro: '다시 정리해야 마음이 놓여요' },
        { text: '그 상황에 맞게 유연하게 흘러가는 편이 자연스러움', type: 'P', micro: '상황 따라 가도 괜찮아요' }
      ]
    },
    {
      id: 'JP_FOLLOWUP_002',
      familyId: 'JP_followup_task_style',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '해야 할 일이 많을 때 더 편한 방식은?',
      options: [
        { text: '순서와 기준을 먼저 정하고 하나씩 끝내기', type: 'J', micro: '정리부터 해야 편해요' },
        { text: '우선 손이 가는 것부터 하면서 흐름 타기', type: 'P', micro: '흐름 따라 움직이는 게 편해요' }
      ]
    },
    {
      id: 'JP_FOLLOWUP_003',
      familyId: 'JP_followup_trip',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '여행이나 외출 약속에서 더 안심되는 건?',
      options: [
        { text: '시간표와 일정이 대략이라도 잡혀 있는 상태', type: 'J', micro: '대략의 틀이 있어야 편해요' },
        { text: '현장 분위기 보면서 그때그때 고를 수 있는 상태', type: 'P', micro: '열려 있어야 재밌어요' }
      ]
    },
    {
      id: 'JP_FOLLOWUP_004',
      familyId: 'JP_followup_deadline',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '마감이 있는 일은 보통 어떻게 처리하게 되나?',
      options: [
        { text: '미리 끝내 두고 마음 편해지고 싶음', type: 'J', micro: '미리 끝내야 마음이 편해요' },
        { text: '막판 집중력으로 몰아붙이는 편이 오히려 잘 맞음', type: 'P', micro: '마감 직전 집중이 잘돼요' }
      ]
    },
    {
      id: 'JP_FOLLOWUP_005',
      familyId: 'JP_followup_room',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '생활 공간이 어질러졌을 때 더 자연스러운 건?',
      options: [
        { text: '빨리 정리하고 다시 원래 상태로 돌리고 싶음', type: 'J', micro: '정리되면 마음도 편해져요' },
        { text: '당장 불편하지 않으면 나중에 한꺼번에 정리함', type: 'P', micro: '급하지 않으면 미뤄도 괜찮아요' }
      ]
    },
    {
      id: 'JP_FOLLOWUP_006',
      familyId: 'JP_followup_decision_window',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '결정을 내려야 할 때 더 편한 건?',
      options: [
        { text: '적당한 시점에 결론을 내리고 넘어가는 것', type: 'J', micro: '결론이 있어야 편해요' },
        { text: '가능하면 조금 더 열어두고 보는 것', type: 'P', micro: '선택지는 남겨두고 싶어요' }
      ]
    },
    {
      id: 'JP_FOLLOWUP_007',
      familyId: 'JP_followup_weekend',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '주말을 더 만족스럽게 보내는 방식은?',
      options: [
        { text: '대충이라도 계획을 세워 두고 움직이는 것', type: 'J', micro: '계획이 있으면 더 잘 즐겨요' },
        { text: '그날 기분 따라 즉흥적으로 정하는 것', type: 'P', micro: '즉흥성이 더 잘 맞아요' }
      ]
    },
    {
      id: 'JP_FOLLOWUP_008',
      familyId: 'JP_followup_workflow',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '일이나 공부 흐름에서 더 힘이 나는 건?',
      options: [
        { text: '체크리스트를 지워가며 진도가 보일 때', type: 'J', micro: '체크되는 흐름이 좋아요' },
        { text: '자유롭게 오가며 아이디어가 붙을 때', type: 'P', micro: '열린 흐름이 더 잘 맞아요' }
      ]
    },
    {
      id: 'JP_FOLLOWUP_009',
      familyId: 'JP_followup_empty_slot',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '계획이 비는 시간이 생기면 더 마음 편한 건?',
      options: [
        { text: '다음 순서를 채워두는 것', type: 'J', micro: '빈칸을 메워야 편해요' },
        { text: '그 비어 있는 상태로 두는 것', type: 'P', micro: '열어둬야 마음이 편해요' }
      ]
    },
    {
      id: 'JP_FOLLOWUP_010',
      familyId: 'JP_followup_workload',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '일이 몰릴 때 더 먼저 하는 건?',
      options: [
        { text: '목록을 만들고 순서를 정함', type: 'J', micro: '정리부터 해야 움직여요' },
        { text: '쉽거나 끌리는 것부터 바로 시작함', type: 'P', micro: '일단 손이 가는 걸 하고 봐요' }
      ]
    },
    {
      id: 'JP_FOLLOWUP_011',
      familyId: 'JP_followup_unexpected_offer',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '예상치 못한 제안이 들어오면 첫 반응은?',
      options: [
        { text: '일정과 조건부터 확인하고 판단함', type: 'J', micro: '정리부터 해야 결정돼요' },
        { text: '재밌어 보이면 일단 끌림이 먼저 옴', type: 'P', micro: '흥미가 먼저 움직여요' }
      ]
    },
    {
      id: 'JP_FOLLOWUP_012',
      familyId: 'JP_followup_rest_day',
      role: 'followup',
      weight: FOLLOWUP_WEIGHT,
      q: '쉬는 날을 잘 보냈다고 느끼는 기준은?',
      options: [
        { text: '생각해둔 걸 대부분 해냈을 때', type: 'J', micro: '마무리된 느낌이 좋아요' },
        { text: '흐름대로 즐기다 예상 밖 재미가 생겼을 때', type: 'P', micro: '뜻밖의 재미가 더 기억나요' }
      ]
    }
  ]
};
