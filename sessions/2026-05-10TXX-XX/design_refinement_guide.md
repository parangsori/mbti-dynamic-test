# 🎨 Killer Sequence - 미학적 완성도 보정 가이드 (Refinement Guide)

## 🎯 목표
Developer가 추출한 프로토타입의 '감각적 불협화음' 수준을 검수하고, 시청자의 강제적 몰입을 유도할 수 있도록 미학적 깊이를 증폭시키는 구체적인 보정 가이드라인을 제공함.

## 🖼️ 핵심 원칙
단순한 '깨짐(Corruption)'을 넘어, **'왜곡된 현실 인지(Distorted Reality Perception)'** 단계로 진입시키는 것이 목표.

## ⚙️ 세부 보정 지침 (Actionable Directives)

### 1. 글리치 타이밍 제어 (Adaptive Glitch Control)
*   **원칙:** 고정된 0.2s 패턴 탈피.
*   **지침:** 오디오 피크(Audio Peak) 감지 시, 글리치 지속 시간 ($\tau$)을 동적으로 변주.
*   **스펙:** $\tau \in [0.15s, 0.3s]$ 범위 내에서 무작위성(Randomness)을 부여하여 예측 불가능성을 극대화.

### 2. 픽셀 왜곡 심화 (Topological Distortion)
*   **원칙:** 평면적 이동(Pixel Shift)에서 구조적 왜곡으로 전환.
*   **지침:** 픽셀 그룹에 **미세한 회전 및 비선형 스케일링**을 결합.
*   **스펙:** 각 왜곡된 블록에 $\text{Rotation} \in [\pm 3^\circ]$ 및 $\text{Scale} \in [0.95, 1.05]$를 적용하여 유기적인 뒤틀림 표현.

### 3. Blackout 잔상 효과 (Afterimage Buffer)
*   **원칙:** 무음(Blackout)을 단순한 정지가 아닌, 정보의 잔류로 활용.
*   **지침:** Blackout 직전 프레임에서 발생한 Cyan/Orange 픽셀에 **미세 투명도(Opacity)**를 부여하여 다음 프레임으로의 시각적 연결고리 생성.
*   **스펙:** $\text{Opacity} = 0.1$ (전체 프레임 기준), 지속 시간은 $0.1s$ Blackout 동안 유지.

### 4. 타이포그래피 응답성 (Responsive Typography)
*   **원칙:** 썸네일/인트로 타이포그래피가 배경의 혼란에 동조하되, 완전히 휩쓸리지는 않도록 균형 유지.
*   **지침:** 핵심 타이포그래피 레이어에 **Low-Frequency Noise Filter**를 적용하여, 고주파 글리치와 대비되는 '인지적 질감'을 부여.
*   **스펙:** 필터 강도(Intensity)는 $0.1$ 이하로 설정하여, '안정된 듯 불안정한' 느낌을 유지.