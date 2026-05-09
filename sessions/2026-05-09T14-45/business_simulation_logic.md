# 📊 AVD 45% 달성 예측 시뮬레이션 모델 (초안)

본 문서는 `Killer Sequence Prototype`의 기술적 정밀도와 시각적 충격이 실제 시청 지속 시간(AVD)에 미치는 상관관계를 정량화하기 위한 알고리즘 논리 구조를 정의한다.

## 1. 핵심 변수 구조화 (Input Variables)

데이터는 Developer의 `synchronization_engine.py` 로그와 Designer의 검수 점수를 기반으로 한다.

### A. 정밀도 변수 (Precision Group)
*   **$\Delta t_{sync}$ (Sync Error):** 오디오 피크와 시각적 이벤트(Glitch/Blackout) 사이의 시간차 (단위: ms).
    *   *목표값:* $\le 50\text{ms}$
*   **$\Delta t_{duration}$ (Glitch Duration):** 글리치/무음 이벤트의 지속 시간.
    *   *목표값:* $150\text{ms} \sim 300\text{ms}$ (의도된 불협화음 범위)

### B. 충격도 변수 (Impact Group)
*   **$S_{impact}$ (Visual Impact Score):** 픽셀 시프트, 왜곡 강도, 색상 대비(Cyan/Orange)의 결합된 시각적 충격 수치.
    *   *범위:* $[0, 1.0]$ (Designer 산출물 기반)
*   **$F_{density}$ (Pattern Density):** 영상 전체 길이 대비 충격 이벤트의 빈도.

## 2. AVD 예측 알고리즘 논리 (The Algorithm Logic)

AVD는 '몰입(Flow)'과 '주의 환기(Attention Capture)'의 함수이다.

### 2.1 기본 모델 식 (Conceptual Formula)
$$AVD_{pred} = AVD_{base} \times [f(S_{impact}) \times g(\Delta t_{sync}) \times h(F_{density})]$$

*   **$AVD_{base}$:** 일반적인 영상의 기본 시청 지속률 (Control Group).
*   **$f(S_{impact})$ [Attraction Factor]:** 시각적 충격이 임계치를 넘을 때 발생하는 주의 집중 효과.
*   **$g(\Delta t_{sync})$ [Cohesion Factor]:** 동기화 오차가 임계치를 벗어날 때 발생하는 피로도/이탈률 가중치.
*   **$h(F_{density})$ [Rhythm Factor]:** 패턴의 반복성과 리듬감이 주는 몰입 유지력.

### 2.2 가중치 계산 로직 (Weighting Logic)

1.  **$\Delta t_{sync}$의 비선형 패널티:**
    *   $|\Delta t_{sync}| > 100\text{ms}$ 일 경우, $g(\Delta t_{sync})$는 급격히 감소(Exponential Decay)하여 AVD를 깎아먹음.
    *   $|\Delta t_{sync}| \le 50\text{ms}$ 일 경우, $g(\Delta t_{sync}) \approx 1.0$ (최적 상태).

2.  **$S_{impact}$의 역U자형 함수 (The Sweet Spot):**
    *   충격이 너무 낮으면($S_{impact} < 0.4$) 시청자는 지루함을 느낌 (AVD 하락).
    *   충격이 너무 높으면($S_{impact} > 0.9$) 시청자는 불쾌감을 느낌 (AVD 하락).
    *   **Optimal Range:** $0.6 \le S_{impact} \le 0.85$ 에서 최대값 도출.

3.  **$F_{density}$의 리듬 제어:**
    *   이벤트 밀도가 너무 높으면 인지 부하(Cognitive Load)로 인해 이탈 발생.
    *   적정 밀도 유지 시 $h(F_{density})$는 가산점 부여.

## 3. 시뮬레이션 실행 프로세스 (Workflow)

1.  **Step 1: 데이터 매핑:** Developer가 생성한 로그에서 각 타임스탬프별 $\Delta t_{sync}$, $S_{impact}$를 추출하여 데이터셋 구축.
2.  **Step 2: 가중치 적용:** 위 논리 모델에 따라 각 프레임/세그먼트별 '기여도 점수' 계산.
3.  **Step 3: Monte Carlo Simulation:** 변수의 미세한 변화(예: $\Delta t_{sync}$가 20ms 변할 때)에 따른 AVD 변화폭을 수만 번 시뮬레이션하여 확률 분포 도출.
4.  **Step 4: 결과 보고:** "현재 스펙으로 AVD 45% 달성 확률은 $X\%$임"을 제시.

---
**[결론: 비즈니스적 의미]**
이 모델의 목적은 단순히 '멋진 영상'을 만드는 것이 아니라, **'어떤 기술적 수치가 AVD 45%라는 비즈니스 목표를 보장하는가'**에 대한 정답지를 찾는 것이다.