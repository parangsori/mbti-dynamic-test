/**
 * questions_meta.js — Phase 1: 문항 메타데이터
 *
 * 각 문항의 id, familyId, role, weight를 QUESTIONS_DB 순서(인덱스)에 맞게 정의합니다.
 * data.js의 QUESTIONS_DB는 그대로 유지하고, 이 파일을 index.html에 추가 로드합니다.
 *
 * role 정의:
 *   anchor      — 해당 축을 명확하게 측정하는 핵심 문항 (weight 1.4, 매 세션 반드시 1개)
 *   discriminator — 경계 성향 구분용 날카로운 문항 (weight 1.1)
 *   state       — 오늘의 기분/상태 반영 문항 (weight 0.8)
 *   consistency — 일관성 체크용 문항 (weight 1.0)
 *
 * familyId는 같은 세션에 2개 이상 출제되지 않도록 제한하는 데 사용됩니다.
 */
window.QUESTIONS_META = {
  EI: [
    { id: "EI_001", familyId: "EI_vacation",    role: "anchor",        weight: 1.4 }, // idx 0
    { id: "EI_002", familyId: "EI_weekend",     role: "anchor",        weight: 1.4 }, // idx 1
    { id: "EI_003", familyId: "EI_meeting",     role: "anchor",        weight: 1.4 }, // idx 2
    { id: "EI_004", familyId: "EI_awkward",     role: "discriminator", weight: 1.1 }, // idx 3
    { id: "EI_005", familyId: "EI_stress",      role: "anchor",        weight: 1.4 }, // idx 4
    { id: "EI_006", familyId: "EI_acquaint",    role: "consistency",   weight: 1.0 }, // idx 5
    { id: "EI_007", familyId: "EI_cafe_seat",   role: "discriminator", weight: 1.1 }, // idx 6
    { id: "EI_008", familyId: "EI_friend_msg",  role: "state",         weight: 0.8 }, // idx 7
    { id: "EI_009", familyId: "EI_spotlight",   role: "anchor",        weight: 1.4 }, // idx 8
    { id: "EI_010", familyId: "EI_openchat",    role: "discriminator", weight: 1.1 }, // idx 9
    { id: "EI_011", familyId: "EI_class_end",   role: "state",         weight: 0.8 }, // idx 10
    { id: "EI_012", familyId: "EI_weekend",     role: "consistency",   weight: 1.0 }, // idx 11
    { id: "EI_013", familyId: "EI_hairshop",    role: "discriminator", weight: 1.1 }, // idx 12
    { id: "EI_014", familyId: "EI_phone",       role: "discriminator", weight: 1.1 }, // idx 13
    { id: "EI_015", familyId: "EI_shopping",    role: "discriminator", weight: 1.1 }, // idx 14
    { id: "EI_016", familyId: "EI_birthday",    role: "anchor",        weight: 1.4 }, // idx 15
    { id: "EI_017", familyId: "EI_street",      role: "state",         weight: 0.8 }, // idx 16
    { id: "EI_018", familyId: "EI_cafe_music",  role: "consistency",   weight: 1.0 }, // idx 17
  ],
  SN: [
    { id: "SN_001", familyId: "SN_word",        role: "anchor",        weight: 1.4 }, // idx 0
    { id: "SN_002", familyId: "SN_machine",     role: "anchor",        weight: 1.4 }, // idx 1
    { id: "SN_003", familyId: "SN_future",      role: "anchor",        weight: 1.4 }, // idx 2
    { id: "SN_004", familyId: "SN_direction",   role: "discriminator", weight: 1.1 }, // idx 3
    { id: "SN_005", familyId: "SN_daydream",    role: "state",         weight: 0.8 }, // idx 4
    { id: "SN_006", familyId: "SN_menu",        role: "discriminator", weight: 1.1 }, // idx 5
    { id: "SN_007", familyId: "SN_work",        role: "anchor",        weight: 1.4 }, // idx 6
    { id: "SN_008", familyId: "SN_movie",       role: "discriminator", weight: 1.1 }, // idx 7
    { id: "SN_009", familyId: "SN_room",        role: "state",         weight: 0.8 }, // idx 8
    { id: "SN_010", familyId: "SN_cooking",     role: "discriminator", weight: 1.1 }, // idx 9
    { id: "SN_011", familyId: "SN_music",       role: "consistency",   weight: 1.0 }, // idx 10
    { id: "SN_012", familyId: "SN_travel_sns",  role: "state",         weight: 0.8 }, // idx 11
    { id: "SN_013", familyId: "SN_project",     role: "discriminator", weight: 1.1 }, // idx 12
    { id: "SN_014", familyId: "SN_tarot",       role: "consistency",   weight: 1.0 }, // idx 13
    { id: "SN_015", familyId: "SN_photo",       role: "anchor",        weight: 1.4 }, // idx 14
    { id: "SN_016", familyId: "SN_art",         role: "discriminator", weight: 1.1 }, // idx 15
    { id: "SN_017", familyId: "SN_puzzle",      role: "anchor",        weight: 1.4 }, // idx 16
    { id: "SN_018", familyId: "SN_regret",      role: "state",         weight: 0.8 }, // idx 17
  ],
  TF: [
    { id: "TF_001", familyId: "TF_friend_dye",  role: "anchor",        weight: 1.4 }, // idx 0
    { id: "TF_002", familyId: "TF_exam_fail",   role: "anchor",        weight: 1.4 }, // idx 1
    { id: "TF_003", familyId: "TF_art_feedback",role: "discriminator", weight: 1.1 }, // idx 2
    { id: "TF_004", familyId: "TF_accident",    role: "discriminator", weight: 1.1 }, // idx 3
    { id: "TF_005", familyId: "TF_movie_cry",   role: "anchor",        weight: 1.4 }, // idx 4
    { id: "TF_006", familyId: "TF_argument",    role: "discriminator", weight: 1.1 }, // idx 5
    { id: "TF_007", familyId: "TF_spill",       role: "state",         weight: 0.8 }, // idx 6
    { id: "TF_008", familyId: "TF_consulting",  role: "anchor",        weight: 1.4 }, // idx 7
    { id: "TF_009", familyId: "TF_gift",        role: "discriminator", weight: 1.1 }, // idx 8
    { id: "TF_010", familyId: "TF_meeting_log", role: "consistency",   weight: 1.0 }, // idx 9
    { id: "TF_011", familyId: "TF_sick_friend", role: "state",         weight: 0.8 }, // idx 10
    { id: "TF_012", familyId: "TF_low_prob",    role: "discriminator", weight: 1.1 }, // idx 11
    { id: "TF_013", familyId: "TF_praise",      role: "anchor",        weight: 1.4 }, // idx 12
    { id: "TF_014", familyId: "TF_work_rule",   role: "consistency",   weight: 1.0 }, // idx 13
    { id: "TF_015", familyId: "TF_breakup",     role: "state",         weight: 0.8 }, // idx 14
    { id: "TF_016", familyId: "TF_game",        role: "discriminator", weight: 1.1 }, // idx 15
    { id: "TF_017", familyId: "TF_gossip",      role: "consistency",   weight: 1.0 }, // idx 16
    { id: "TF_018", familyId: "TF_blind_date",  role: "anchor",        weight: 1.4 }, // idx 17
  ],
  JP: [
    { id: "JP_001", familyId: "JP_travel_prep", role: "anchor",        weight: 1.4 }, // idx 0
    { id: "JP_002", familyId: "JP_appointment", role: "anchor",        weight: 1.4 }, // idx 1
    { id: "JP_003", familyId: "JP_desk",        role: "discriminator", weight: 1.1 }, // idx 2
    { id: "JP_004", familyId: "JP_plan_fail",   role: "discriminator", weight: 1.1 }, // idx 3
    { id: "JP_005", familyId: "JP_alarm",       role: "anchor",        weight: 1.4 }, // idx 4
    { id: "JP_006", familyId: "JP_train",       role: "state",         weight: 0.8 }, // idx 5
    { id: "JP_007", familyId: "JP_cancel",      role: "consistency",   weight: 1.0 }, // idx 6
    { id: "JP_008", familyId: "JP_battery",     role: "state",         weight: 0.8 }, // idx 7
    { id: "JP_009", familyId: "JP_mart",        role: "discriminator", weight: 1.1 }, // idx 8
    { id: "JP_010", familyId: "JP_task",        role: "anchor",        weight: 1.4 }, // idx 9
    { id: "JP_011", familyId: "JP_kitchen",     role: "discriminator", weight: 1.1 }, // idx 10
    { id: "JP_012", familyId: "JP_problem",     role: "consistency",   weight: 1.0 }, // idx 11
    { id: "JP_013", familyId: "JP_date",        role: "discriminator", weight: 1.1 }, // idx 12
    { id: "JP_014", familyId: "JP_bookshelf",   role: "state",         weight: 0.8 }, // idx 13
    { id: "JP_015", familyId: "JP_desktop",     role: "discriminator", weight: 1.1 }, // idx 14
    { id: "JP_016", familyId: "JP_goal",        role: "anchor",        weight: 1.4 }, // idx 15
    { id: "JP_017", familyId: "JP_exit_check",  role: "consistency",   weight: 1.0 }, // idx 16
    { id: "JP_018", familyId: "JP_restaurant",  role: "state",         weight: 0.8 }, // idx 17
  ]
};
