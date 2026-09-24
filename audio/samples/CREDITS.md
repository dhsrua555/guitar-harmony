# 악기 녹음 출처

이 폴더의 MP3 는 아래 녹음을 받아 `dev/build_samples.py` 로 다듬은 것입니다
(앞 무음 제거, 길이 맞춤, 끝 페이드, 음마다 음량 고르기, 모노 128kbps 로 변환).
기타 · 일렉 베이스 · 피아노는 원본과 같이 **Creative Commons Attribution 3.0 (CC BY 3.0)** 을 따릅니다
(https://creativecommons.org/licenses/by/3.0/). 드럼과 콘트라베이스는 원본이 **CC0 (퍼블릭 도메인)** 입니다.

| 폴더 | 악기 | 원본 |
| --- | --- | --- |
| `steel/` | 어쿠스틱 기타 | University of Iowa Electronic Music Studios, Musical Instrument Samples |
| `nylon/` | 클래식 기타 | Freesound 사용자 quartertone, 나일론 기타 샘플 팩 (11573) |
| `electric/` | 일렉 기타 | Karoryfer Samples |
| `bass/` | 일렉 베이스 | Karoryfer Samples |
| `piano/` | 피아노 | Salamander Grand Piano V3 (Yamaha C5), Alexander Holm |
| `drums/` | 드럼 (재즈 킷, 스틱) | [Virtuosity Drums](https://github.com/sfzinstruments/virtuosity_drums), Versilian Studios · Karoryfer Samples (드러머 Austin McMahon), CC0. 셰이커는 같은 모음의 VSCO 2 타악기 |
| `upright/` | 콘트라베이스 (피치카토) | [D. Smolken 1958 Otto Rubner double bass](https://github.com/sfzinstruments/dsmolken.double-bass), CC0 |

- 기타 · 베이스 녹음은 Nicholas Brosowsky 의 [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments) 모음(CC BY 3.0)에서 받았습니다.
- 피아노는 [Tone.js 가 공개한 Salamander 샘플](https://tonejs.github.io/audio/salamander/)에서 받았습니다.
- 드럼 · 콘트라베이스는 `dev/build_kit.py` 로 킥 · 스네어 · 오버헤드 마이크를 섞고 타격을 한 파일(`kit.mp3`, `pizz.mp3`)에 이어 붙였습니다. 위치와 세기는 같은 이름의 `.json` 에 있습니다.
- 메트로놈 · 우드블록 소리는 `js/audio/synth.js` 에서 합성합니다.
