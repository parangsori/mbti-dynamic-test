# 📊 AVD 예측 시뮬레이션 및 변수 영향력 분석 계획

## 1. 개요
Developer로부터 전달받을 `synchronization_engine.py` 결과 데이터(JSON)를 바탕으로, 설계된 AVD 예측 모델을 구동하여 목표 KPI(45%) 달성 여부를 시뮬레이션함.

## 2. 핵심 변수 정의 (Input Variables)
시각적 충격과 정밀도가 AVD에 미치는 영향을 다음과 같이 구조화함:
- **$S_{impact}$ (Visual Impact Score):** 픽셀 시프트, 글리치 강도, 색상 대비(Cyan/Orange)의 총합.
- **$V_{sync}$ (Sync Precision):** 오디오 피크와 시각적 이벤트 간의 시간차(ms 단위).
- **$D_{duration}$ (Glitch Duration):** 글리치 지속 시간의 적절성 (0.15s~0.3s 범위 내 최적점 탐색).
- **$R_{entropy}$ (Visual Entropy):** 화면 내 움직임 및 왜곡의 복잡도.

## 3. AVD 예측 모델 로직 (Algorithm Draft)
AVD는 기본적으로 '주의 집중(Attention)'과 '지루함 방지(Anti-Boredom)'의 함수임.
$$AVD_{pred} = \alpha(S_{impact}) + \beta(V_{sync}^{-1}) + \gamma(D_{duration\_optimal}) - \delta(R_{entropy\_excess})$$
- $\alpha, \beta, \gamma$: 가중치 파라미터 (실험적 조정)
- $\delta$: 너무 과도한 엔트로피가 인지 부하를 일으켜 시청을 포기하게 만드는 페널티

## 4. 분석 프로세스
1. **Data Ingestion:** Developer의 JSON 데이터셋 로드.
2. **Simulation Run:** 정의된 알고리즘을 통한 각 시퀀스별 예상 AVD 산출.
3. **Sensitivity Analysis:** 어떤 변수($S_{impact}$ vs $V_{sync}$)가 AVD 변화에 가장 민감하게 작정한지 분석.
4. **Optimization Guide:** 45% 달성을 위한 최적의 변수 조합(Sweet Spot) 도출.

## 5. 기대 결과물
- **AVD 예측 리포트:** 각 시퀀스별 예상 AVD % 및 목표 달성 여부.
- **변수 영향력 차트:** $S_{impact}$, $V_{sync}$ 등의 상관관계 시각화 데이터.
- **최종 제작 가이드:** Designer와 Developer에게 전달할 'Winning Spec' 확정.