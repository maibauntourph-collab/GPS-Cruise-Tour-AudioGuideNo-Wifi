import { type City } from "../../shared/schema";

export const CITIES: City[] = [
  {
    "id": "penang",
    "name": "Penang",
    "country": "Malaysia",
    "lat": 5.4164,
    "lng": 100.3327,
    "zoom": 13,
    "cruisePort": null,
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:38.317Z",
    "updatedAt": "2026-02-22T18:05:45.060Z"
  },
  {
    "id": "kuala-lumpur",
    "name": "Kuala Lumpur",
    "country": "Malaysia",
    "lat": 3.139,
    "lng": 101.6869,
    "zoom": 13,
    "cruisePort": null,
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:38.447Z",
    "updatedAt": "2026-02-22T18:05:45.145Z"
  },
  {
    "id": "rome",
    "name": "Rome",
    "country": "Italy",
    "lat": 41.8902,
    "lng": 12.4922,
    "zoom": 14,
    "cruisePort": {
      "portName": "Civitavecchia Port",
      "distanceFromCity": "80km from Rome",
      "recommendedDuration": "7-8 hours",
      "recommendedLandmarks": [
        "colosseum",
        "vatican_museums",
        "trevi-fountain",
        "pantheon",
        "roman-forum"
      ],
      "tips": "⚠️ IMPORTANT: Always check your ship's boarding time and plan to return 1-2 hours early. Book a shore excursion in advance or take the train from Civitavecchia to Rome (80 minutes). Start early to see the main attractions. Consider skip-the-line tickets for the Vatican and Colosseum. If using a tender boat to reach port, get your tender ticket from the cruise ship in advance.",
      "portCoordinates": {
        "lat": 42.0943,
        "lng": 11.7967
      },
      "transportOptions": [
        {
          "type": "train",
          "name": "Trenitalia Regional Train",
          "from": "Civitavecchia Station",
          "to": "Roma Termini / Roma San Pietro",
          "duration": "60-80 minutes",
          "frequency": "Every 30-60 minutes",
          "price": "€5-15",
          "bookingUrl": "https://www.trenitalia.com",
          "tips": "Station is 700m from port (10min walk or free shuttle). Buy tickets at station or online. Validate ticket before boarding.",
          "translations": {
            "ko": {
              "name": "Trenitalia 지역 기차",
              "from": "치비타베키아역",
              "to": "로마 테르미니 / 로마 산 피에트로",
              "duration": "60-80분",
              "frequency": "30-60분마다",
              "price": "€5-15",
              "tips": "역은 항구에서 700m (도보 10분 또는 무료 셔틀). 역이나 온라인에서 티켓 구매. 탑승 전 티켓 검증 필수."
            },
            "it": {
              "name": "Treno Regionale Trenitalia",
              "from": "Stazione di Civitavecchia",
              "to": "Roma Termini / Roma San Pietro",
              "duration": "60-80 minuti",
              "frequency": "Ogni 30-60 minuti",
              "price": "€5-15",
              "tips": "La stazione dista 700m dal porto (10min a piedi o navetta gratuita). Acquista i biglietti in stazione o online. Convalida il biglietto prima di salire."
            }
          }
        },
        {
          "type": "shuttle",
          "name": "Shore Excursion Shuttle",
          "from": "Civitavecchia Port",
          "to": "Rome City Center",
          "duration": "90 minutes",
          "frequency": "Based on cruise schedule",
          "price": "€20-40 per person",
          "bookingUrl": "https://www.getyourguide.com",
          "tips": "Book through your cruise line or GetYourGuide. Includes round-trip transportation.",
          "translations": {
            "ko": {
              "name": "기항지 투어 셔틀",
              "from": "치비타베키아 항구",
              "to": "로마 시내",
              "duration": "90분",
              "frequency": "크루즈 일정에 따라",
              "price": "1인당 €20-40",
              "tips": "크루즈 라인이나 GetYourGuide를 통해 예약. 왕복 교통 포함."
            },
            "it": {
              "name": "Navetta Escursione a Terra",
              "from": "Porto di Civitavecchia",
              "to": "Centro di Roma",
              "duration": "90 minuti",
              "frequency": "In base al programma della crociera",
              "price": "€20-40 a persona",
              "tips": "Prenota tramite la tua compagnia di crociera o GetYourGuide. Include trasporto andata e ritorno."
            }
          }
        },
        {
          "type": "taxi",
          "name": "Private Taxi",
          "from": "Civitavecchia Port",
          "to": "Rome City Center",
          "duration": "60-75 minutes",
          "frequency": "On demand",
          "price": "€120-150 (fixed rate)",
          "tips": "Official white taxis available at port exit. Agree on price before departure. Fits 4 passengers + luggage.",
          "translations": {
            "ko": {
              "name": "개인 택시",
              "from": "치비타베키아 항구",
              "to": "로마 시내",
              "duration": "60-75분",
              "frequency": "수시",
              "price": "€120-150 (고정 요금)",
              "tips": "항구 출구에서 공식 흰색 택시 이용 가능. 출발 전 요금 합의. 승객 4명 + 짐 탑승 가능."
            },
            "it": {
              "name": "Taxi Privato",
              "from": "Porto di Civitavecchia",
              "to": "Centro di Roma",
              "duration": "60-75 minuti",
              "frequency": "Su richiesta",
              "price": "€120-150 (tariffa fissa)",
              "tips": "Taxi bianchi ufficiali disponibili all'uscita del porto. Concordare il prezzo prima della partenza. Può ospitare 4 passeggeri + bagagli."
            }
          }
        },
        {
          "type": "rideshare",
          "name": "Uber / Bolt",
          "from": "Civitavecchia Port",
          "to": "Rome City Center",
          "duration": "60-75 minutes",
          "frequency": "On demand via app",
          "price": "€80-120",
          "tips": "Use Uber or Bolt app to request ride from port. Price varies by demand. Payment handled through app.",
          "translations": {
            "ko": {
              "name": "우버 / 볼트",
              "from": "치비타베키아 항구",
              "to": "로마 시내",
              "duration": "60-75분",
              "frequency": "앱을 통한 수시",
              "price": "€80-120",
              "tips": "Uber 또는 Bolt 앱으로 항구에서 차량 요청. 수요에 따라 가격 변동. 앱으로 결제 처리."
            },
            "it": {
              "name": "Uber / Bolt",
              "from": "Porto di Civitavecchia",
              "to": "Centro di Roma",
              "duration": "60-75 minuti",
              "frequency": "Su richiesta tramite app",
              "price": "€80-120",
              "tips": "Usa l'app Uber o Bolt per richiedere una corsa dal porto. Il prezzo varia in base alla domanda. Pagamento gestito tramite app."
            }
          }
        }
      ],
      "translations": {
        "ko": {
          "portName": "치비타베키아 항구",
          "distanceFromCity": "로마에서 80km",
          "recommendedDuration": "7-8시간",
          "tips": "⚠️ 중요: 항상 선박 승선 시간을 확인하고 1-2시간 일찍 돌아올 계획을 세우세요. 미리 기항지 관광을 예약하거나 치비타베키아에서 로마까지 기차를 이용하세요 (80분 소요). 주요 명소를 보려면 일찍 출발하세요. 바티칸과 콜로세움은 줄서기 패스 티켓을 고려하세요. 텐더보트를 이용해 항구로 나가야 하는 경우, 크루즈에서 미리 텐더티켓을 받아 준비하세요."
        },
        "it": {
          "portName": "Porto di Civitavecchia",
          "distanceFromCity": "80km da Roma",
          "recommendedDuration": "7-8 ore",
          "tips": "⚠️ IMPORTANTE: Controlla sempre l'orario di imbarco della nave e pianifica di tornare 1-2 ore prima. Prenota un'escursione in anticipo o prendi il treno da Civitavecchia a Roma (80 minuti). Parti presto per vedere le principali attrazioni. Considera i biglietti salta fila per il Vaticano e il Colosseo. Se usi una tender boat per raggiungere il porto, ottieni il biglietto tender dalla nave in anticipo."
        }
      }
    },
    "landingContent": {
      "en": {
        "title": "Welcome to the Eternal City, Rome",
        "subTitle": "Your Offline Guide to Rome's History and Art",
        "heroImage": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200"
      },
      "ko": {
        "title": "영원한 도시, 로마에 오신 것을 환영합니다",
        "subTitle": "인터넷 없이도 즐기는 로마의 역사와 예술 가이드",
        "heroImage": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200"
      }
    },
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:36.162Z",
    "updatedAt": "2026-02-22T18:05:44.107Z"
  },
  {
    "id": "paris",
    "name": "Paris",
    "country": "France",
    "lat": 48.8566,
    "lng": 2.3522,
    "zoom": 13,
    "cruisePort": null,
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:36.293Z",
    "updatedAt": "2026-02-22T18:05:44.185Z"
  },
  {
    "id": "london",
    "name": "London",
    "country": "United Kingdom",
    "lat": 51.5074,
    "lng": -0.1278,
    "zoom": 13,
    "cruisePort": null,
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:36.420Z",
    "updatedAt": "2026-02-22T18:05:44.244Z"
  },
  {
    "id": "anchorage",
    "name": "Anchorage",
    "country": "USA",
    "lat": 61.2181,
    "lng": -149.9003,
    "zoom": 13,
    "cruisePort": null,
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:36.549Z",
    "updatedAt": "2026-02-22T18:05:44.307Z"
  },
  {
    "id": "amsterdam",
    "name": "Amsterdam",
    "country": "Netherlands",
    "lat": 52.3676,
    "lng": 4.9041,
    "zoom": 13,
    "cruisePort": null,
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:36.904Z",
    "updatedAt": "2026-02-22T18:05:44.367Z"
  },
  {
    "id": "barcelona",
    "name": "Barcelona",
    "country": "Spain",
    "lat": 41.3851,
    "lng": 2.1734,
    "zoom": 13,
    "cruisePort": {
      "portName": "Port of Barcelona",
      "distanceFromCity": "Right in the city center",
      "recommendedDuration": "6-8 hours",
      "recommendedLandmarks": [
        "sagrada-familia",
        "park-guell",
        "gothic-quarter"
      ],
      "tips": "⚠️ IMPORTANT: Always check your ship's boarding time and plan to return 1-2 hours early. The cruise port is very close to Las Ramblas and the Gothic Quarter. Use the shuttle bus or taxi to reach Sagrada Familia. Buy tickets online in advance to avoid long queues. If using a tender boat to reach port, get your tender ticket from the cruise ship in advance.",
      "portCoordinates": {
        "lat": 41.3652,
        "lng": 2.1774
      },
      "transportOptions": [
        {
          "type": "shuttle",
          "name": "Port Shuttle Bus (Blue Bus)",
          "from": "Cruise Terminal",
          "to": "Columbus Monument (Las Ramblas)",
          "duration": "15 minutes",
          "frequency": "Every 20-30 minutes",
          "price": "€3 per person",
          "tips": "Free shuttle often provided by cruise lines. Otherwise use the Blue Bus (Porta Bus). Runs when ships are in port.",
          "translations": {
            "ko": {
              "name": "항구 셔틀버스 (블루 버스)",
              "from": "크루즈 터미널",
              "to": "콜럼버스 기념비 (람블라스 거리)",
              "duration": "15분",
              "frequency": "20-30분마다",
              "price": "1인당 €3",
              "tips": "크루즈 라인이 무료 셔틀을 제공하는 경우가 많습니다. 그렇지 않으면 블루 버스(Porta Bus) 이용. 배가 정박할 때만 운행."
            },
            "it": {
              "name": "Navetta del Porto (Bus Blu)",
              "from": "Terminal Crociere",
              "to": "Monumento a Colombo (Las Ramblas)",
              "duration": "15 minuti",
              "frequency": "Ogni 20-30 minuti",
              "price": "€3 a persona",
              "tips": "Navetta gratuita spesso fornita dalle compagnie di crociera. Altrimenti usa il Bus Blu (Porta Bus). Funziona quando le navi sono in porto."
            }
          }
        },
        {
          "type": "bus",
          "name": "Hop-on Hop-off Barcelona Bus Turístic",
          "from": "Port (World Trade Center)",
          "to": "Sagrada Familia, Park Güell, Gothic Quarter",
          "duration": "Full day pass",
          "frequency": "Every 10-15 minutes",
          "price": "€32-35 per day",
          "bookingUrl": "https://www.barcelona-tourist-guide.com/en/bus-tourist/barcelona-bus-turistic.html",
          "tips": "Best option for cruise passengers. Covers all major attractions. Buy tickets online for discount. Audio guide in 15 languages.",
          "translations": {
            "ko": {
              "name": "Hop-on Hop-off 바르셀로나 버스 투리스틱",
              "from": "항구 (월드 트레이드 센터)",
              "to": "사그라다 파밀리아, 구엘 공원, 고딕 지구",
              "duration": "1일 패스",
              "frequency": "10-15분마다",
              "price": "1일 €32-35",
              "tips": "크루즈 승객에게 최고의 옵션. 모든 주요 명소 포함. 온라인 티켓 구매 시 할인. 15개 언어 오디오 가이드."
            },
            "it": {
              "name": "Hop-on Hop-off Barcelona Bus Turístic",
              "from": "Porto (World Trade Center)",
              "to": "Sagrada Familia, Park Güell, Quartiere Gotico",
              "duration": "Pass giornaliero",
              "frequency": "Ogni 10-15 minuti",
              "price": "€32-35 al giorno",
              "tips": "Opzione migliore per i passeggeri delle crociere. Copre tutte le attrazioni principali. Acquista i biglietti online per lo sconto. Audioguida in 15 lingue."
            }
          }
        },
        {
          "type": "bus",
          "name": "Metro L3 (Green Line)",
          "from": "Drassanes Station (15min walk from port)",
          "to": "Sagrada Familia, Passeig de Gràcia",
          "duration": "20-30 minutes",
          "frequency": "Every 5-10 minutes",
          "price": "€2.40 single / €11.35 for 10 trips",
          "bookingUrl": "https://www.tmb.cat/en/home",
          "tips": "Most economical option. Walk to Drassanes station or take shuttle bus first. Buy T-10 ticket for multiple trips.",
          "translations": {
            "ko": {
              "name": "메트로 L3 (녹색 라인)",
              "from": "Drassanes 역 (항구에서 도보 15분)",
              "to": "사그라다 파밀리아, 그라시아 거리",
              "duration": "20-30분",
              "frequency": "5-10분마다",
              "price": "편도 €2.40 / 10회권 €11.35",
              "tips": "가장 경제적인 옵션. Drassanes 역까지 걸어가거나 먼저 셔틀버스 이용. 여러 번 이용 시 T-10 티켓 구매."
            },
            "it": {
              "name": "Metro L3 (Linea Verde)",
              "from": "Stazione Drassanes (15min a piedi dal porto)",
              "to": "Sagrada Familia, Passeig de Gràcia",
              "duration": "20-30 minuti",
              "frequency": "Ogni 5-10 minuti",
              "price": "€2.40 singolo / €11.35 per 10 viaggi",
              "tips": "Opzione più economica. Cammina fino alla stazione Drassanes o prendi prima la navetta. Acquista il biglietto T-10 per più viaggi."
            }
          }
        },
        {
          "type": "shuttle",
          "name": "GetYourGuide Shore Excursion",
          "from": "Barcelona Cruise Port",
          "to": "Guided City Tour (Sagrada Familia, Gothic Quarter, etc.)",
          "duration": "4-8 hours",
          "frequency": "Based on booking",
          "price": "€45-150 per person",
          "bookingUrl": "https://www.getyourguide.com/barcelona-l45/shore-excursions-tc147/",
          "tips": "Pre-arranged tours guarantee return to ship on time. Includes skip-the-line tickets. Book 48 hours in advance.",
          "translations": {
            "ko": {
              "name": "GetYourGuide 기항지 투어",
              "from": "바르셀로나 크루즈 포트",
              "to": "가이드 시티 투어 (사그라다 파밀리아, 고딕 지구 등)",
              "duration": "4-8시간",
              "frequency": "예약에 따라",
              "price": "1인당 €45-150",
              "tips": "사전 예약 투어로 정시 복귀 보장. 줄서기 패스 티켓 포함. 48시간 전 예약."
            },
            "it": {
              "name": "GetYourGuide Escursione a Terra",
              "from": "Porto Crociere di Barcellona",
              "to": "Tour Guidato della Città (Sagrada Familia, Quartiere Gotico, ecc.)",
              "duration": "4-8 ore",
              "frequency": "In base alla prenotazione",
              "price": "€45-150 a persona",
              "tips": "I tour preordinati garantiscono il rientro in nave em tempo. Include biglietti salta fila. Prenota 48 ore prima."
            }
          }
        },
        {
          "type": "taxi",
          "name": "Official Taxi",
          "from": "Cruise Terminal",
          "to": "Any city destination",
          "duration": "10-30 minutes depending on destination",
          "frequency": "On demand",
          "price": "€15-30 to city center",
          "tips": "Official yellow and black taxis available at terminal exit. Meter-based pricing. Ask for receipt.",
          "translations": {
            "ko": {
              "name": "공식 택시",
              "from": "크루즈 터미널",
              "to": "모든 도시 목적지",
              "duration": "목적지에 따라 10-30분",
              "frequency": "수시",
              "price": "시내까지 €15-30",
              "tips": "터미널 출구에서 공식 노란색과 검은색 택시 이용 가능. 미터기 요금. 영수증 요청."
            },
            "it": {
              "name": "Taxi Ufficiale",
              "from": "Terminal Crociere",
              "to": "Qualsiasi destinazione in città",
              "duration": "10-30 minuti a seconda della destinazione",
              "frequency": "Su richiesta",
              "price": "€15-30 per il centro città",
              "tips": "Taxi ufficiali gialli e neri disponibili all'uscita del terminal. Prezzo al tassametro. Chiedi la ricevuta."
            }
          }
        },
        {
          "type": "rideshare",
          "name": "Uber / Cabify",
          "from": "Barcelona Cruise Port",
          "to": "City Center",
          "duration": "15-25 minutes",
          "frequency": "On demand via app",
          "price": "€12-25",
          "tips": "Use Uber or Cabify app. Cabify is popular in Barcelona. Price varies by demand. Pickup at designated area.",
          "translations": {
            "ko": {
              "name": "우버 / 캐비파이",
              "from": "바르셀로나 크루즈 포트",
              "to": "시내",
              "duration": "15-25분",
              "frequency": "앱을 통한 수시",
              "price": "€12-25",
              "tips": "Uber 또는 Cabify 앱 사용. Cabify가 바르셀로나에서 인기. 수요에 따라 가격 변동. 지정된 구역에서 픽업."
            },
            "it": {
              "name": "Uber / Cabify",
              "from": "Porto Crociere di Barcellona",
              "to": "Centro Città",
              "duration": "15-25 minuti",
              "frequency": "Su richiesta tramite app",
              "price": "€12-25",
              "tips": "Usa l'app Uber o Cabify. Cabify è popolare a Barcellona. Il prezzo varia in base alla domanda. Ritiro nell'area designata."
            }
          }
        }
      ],
      "translations": {
        "ko": {
          "portName": "바르셀로나 항구",
          "distanceFromCity": "도심 바로 근처",
          "recommendedDuration": "6-8시간",
          "tips": "⚠️ 중요: 항상 선박 승선 시간을 확인하고 1-2시간 일찍 돌아올 계획을 세우세요. 크루즈 항구는 람블라스 거리와 고딕 지구에서 매우 가깝습니다. 셔틀버스나 택시를 이용하여 사그라다 파밀리아에 도달하세요. 긴 줄을 피하려면 온라인으로 미리 티켓을 구매하세요. 텐더보트를 이용해 항구로 나가야 하는 경우, 크루즈에서 미리 텐더티켓을 받아 준비하세요."
        },
        "it": {
          "portName": "Porto di Barcellona",
          "distanceFromCity": "Proprio nel centro città",
          "recommendedDuration": "6-8 ore",
          "tips": "⚠️ IMPORTANTE: Controlla sempre l'orario di imbarco della nave e pianifica di tornare 1-2 ore prima. Il porto delle crociere è molto vicino a Las Ramblas e al Quartiere Gotico. Usa il bus navetta o il taxi per raggiungere la Sagrada Familia. Acquista i biglietti online in anticipo per evitare lunghe code. Se usi una tender boat per raggiungere il porto, ottieni il biglietto tender dalla nave in anticipo."
        }
      }
    },
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:37.033Z",
    "updatedAt": "2026-02-22T18:05:44.432Z"
  },
  {
    "id": "budapest",
    "name": "Budapest",
    "country": "Hungary",
    "lat": 47.4979,
    "lng": 19.0402,
    "zoom": 13,
    "cruisePort": null,
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:37.414Z",
    "updatedAt": "2026-02-22T18:05:44.633Z"
  },
  {
    "id": "warsaw",
    "name": "Warsaw",
    "country": "Poland",
    "lat": 52.2297,
    "lng": 21.0122,
    "zoom": 13,
    "cruisePort": null,
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:37.538Z",
    "updatedAt": "2026-02-22T18:05:44.697Z"
  },
  {
    "id": "copenhagen",
    "name": "Copenhagen",
    "country": "Denmark",
    "lat": 55.6761,
    "lng": 12.5683,
    "zoom": 13,
    "cruisePort": {
      "portName": "Copenhagen Cruise Terminal",
      "distanceFromCity": "Walking distance to city center",
      "recommendedDuration": "6-8 hours",
      "recommendedLandmarks": [
        "tivoli-gardens",
        "nyhavn",
        "little-mermaid"
      ],
      "tips": "The cruise terminal is within walking distance of Nyhavn and the Little Mermaid. Rent a bike to explore like a local or take a canal tour to see the city from the water.",
      "translations": {
        "ko": {
          "portName": "코펜하겐 크루즈 터미널",
          "distanceFromCity": "도심까지 도보 거리",
          "recommendedDuration": "6-8시간",
          "tips": "크루즈 터미널은 뉘하운과 인어공주 동상까지 도보 거리에 있습니다. 현지인처럼 자전거를 빌려 탐험하거나 운하 투어를 통해 물에서 도시를 보세요."
        },
        "it": {
          "portName": "Terminal Crociere di Copenaghen",
          "distanceFromCity": "A piedi dal centro città",
          "recommendedDuration": "6-8 ore",
          "tips": "Il terminal delle crociere è a poca distanza a piedi da Nyhavn e dalla Sirenetta. Noleggia una bici per esplorare come un locale o fai un tour dei canali per vedere la città dall'acqua."
        }
      }
    },
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:37.792Z",
    "updatedAt": "2026-02-22T18:05:44.817Z"
  },
  {
    "id": "oslo",
    "name": "Oslo",
    "country": "Norway",
    "lat": 59.9139,
    "lng": 10.7522,
    "zoom": 13,
    "cruisePort": null,
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:37.921Z",
    "updatedAt": "2026-02-22T18:05:44.876Z"
  },
  {
    "id": "cebu",
    "name": "Cebu",
    "country": "Philippines",
    "lat": 10.3157,
    "lng": 123.8854,
    "zoom": 13,
    "cruisePort": null,
    "landingContent": {
      "en": {
        "title": "Paradise Found: Cebu City",
        "subTitle": "Beautiful Island of Beaches and Heritage Sites",
        "heroImage": "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1200"
      },
      "ko": {
        "title": "에메랄드빛 낙원, 세부",
        "subTitle": "해변과 역사적 유산이 공존하는 아름다운 섬",
        "heroImage": "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1200"
      }
    },
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:38.057Z",
    "updatedAt": "2026-02-22T18:05:44.938Z"
  },
  {
    "id": "singapore",
    "name": "Singapore",
    "country": "Singapore",
    "lat": 1.2897,
    "lng": 103.8501,
    "zoom": 13,
    "cruisePort": {
      "portName": "Marina Bay Cruise Centre",
      "distanceFromCity": "In the city",
      "recommendedDuration": "6-8 hours",
      "recommendedLandmarks": [
        "merlion",
        "marina-bay-sands",
        "gardens-by-the-bay",
        "singapore-flyer",
        "chinatown-sg"
      ],
      "tips": "The cruise terminal is near Marina Bay. Gardens by the Bay and the Merlion are within walking distance. Use the MRT (subway) for efficient travel. Visit Chinatown or Little India for cultural experiences.",
      "translations": {
        "ko": {
          "portName": "마리나 베이 크루즈 센터",
          "distanceFromCity": "도심",
          "recommendedDuration": "6-8시간",
          "tips": "크루즈 터미널은 마리나 베이 근처에 있습니다. 가든스 바이 더 베이와 멀라이언은 도보 거리에 있습니다. 효율적인 이동을 위해 MRT(지하철)를 이용하세요. 문화 체험을 위해 차이나타운이나 리틀 인디아를 방문하세요."
        },
        "it": {
          "portName": "Marina Bay Cruise Centre",
          "distanceFromCity": "In città",
          "recommendedDuration": "6-8 ore",
          "tips": "Il terminal delle crociere è vicino a Marina Bay. Gardens by the Bay e il Merlion sono raggiungibili a piedi. Usa la MRT (metropolitana) per viaggiare in modo efficiente. Visita Chinatown o Little India per esperienze culturali."
        }
      }
    },
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:38.190Z",
    "updatedAt": "2026-02-22T18:05:44.996Z"
  },
  {
    "id": "phuket",
    "name": "Phuket",
    "country": "Thailand",
    "lat": 7.8804,
    "lng": 98.3923,
    "zoom": 13,
    "cruisePort": null,
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:38.590Z",
    "updatedAt": "2026-02-22T18:05:45.207Z"
  },
  {
    "id": "seoul",
    "name": "서울특별시",
    "country": "대한민국",
    "lat": 37.5665,
    "lng": 126.978,
    "zoom": 11,
    "cruisePort": null,
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T12:43:00.043Z",
    "updatedAt": "2026-02-22T18:05:45.268Z"
  },
  {
    "id": "tokyo",
    "name": "도쿄",
    "country": "일본",
    "lat": 35.6762,
    "lng": 139.6503,
    "zoom": 11,
    "cruisePort": {
      "name": "Yokohama Port",
      "lat": 35.4542,
      "lng": 139.6472
    },
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T12:57:20.925Z",
    "updatedAt": "2026-02-22T18:05:45.331Z"
  },
  {
    "id": "busan",
    "name": "부산광역시",
    "country": "대한민국",
    "lat": 35.1796,
    "lng": 129.0756,
    "zoom": 11,
    "cruisePort": {
      "name": "Busan International Cruise Terminal",
      "lat": 35.0987,
      "lng": 129.0403
    },
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T12:57:20.997Z",
    "updatedAt": "2026-02-22T18:05:45.390Z"
  },
  {
    "id": "brussels",
    "name": "Brussels",
    "country": "Belgium",
    "lat": 50.8503,
    "lng": 4.3517,
    "zoom": 13,
    "cruisePort": null,
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:37.160Z",
    "updatedAt": "2026-02-22T18:05:44.510Z"
  },
  {
    "id": "prague",
    "name": "Prague",
    "country": "Czech Republic",
    "lat": 50.0755,
    "lng": 14.4378,
    "zoom": 13,
    "cruisePort": null,
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:37.287Z",
    "updatedAt": "2026-02-22T18:05:44.574Z"
  },
  {
    "id": "jeju",
    "name": "제주특별자치도",
    "country": "대한민국",
    "lat": 33.4996,
    "lng": 126.5312,
    "zoom": 10,
    "cruisePort": {
      "name": "Jeju Cruise Terminal",
      "lat": 33.5283,
      "lng": 126.5412
    },
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T12:57:21.056Z",
    "updatedAt": "2026-02-22T18:05:45.452Z"
  },
  {
    "id": "new-york",
    "name": "뉴욕",
    "country": "미국",
    "lat": 40.7128,
    "lng": -74.006,
    "zoom": 11,
    "cruisePort": {
      "name": "Manhattan Cruise Terminal",
      "lat": 40.7695,
      "lng": -73.9972
    },
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T12:57:21.116Z",
    "updatedAt": "2026-02-22T18:05:45.512Z"
  },
  {
    "id": "bangkok",
    "name": "방콕",
    "country": "태국",
    "lat": 13.7563,
    "lng": 100.5018,
    "zoom": 11,
    "cruisePort": {
      "name": "Laem Chabang Port",
      "lat": 13.0801,
      "lng": 100.9103
    },
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T12:57:21.177Z",
    "updatedAt": "2026-02-22T18:05:45.575Z"
  },
  {
    "id": "stockholm",
    "name": "Stockholm",
    "country": "Sweden",
    "lat": 59.3293,
    "lng": 18.0686,
    "zoom": 13,
    "cruisePort": {
      "portName": "Stockholm Cruise Terminal",
      "distanceFromCity": "In the city center",
      "recommendedDuration": "6-8 hours",
      "recommendedLandmarks": [
        "vasa-museum",
        "gamla-stan",
        "royal-palace-stockholm"
      ],
      "tips": "The cruise port is centrally located. Walk to Gamla Stan (Old Town) or take a short ferry to visit museums. The hop-on-hop-off boat tour is a great option for cruise passengers.",
      "translations": {
        "ko": {
          "portName": "스톡홀름 크루즈 터미널",
          "distanceFromCity": "도심",
          "recommendedDuration": "6-8시간",
          "tips": "크루즈 항구는 중심부에 위치해 있습니다. 감라 스탄(구시가지)까지 걸어가거나 박물관 방문을 위해 짧은 페리를 이용하세요. 홉온홉오프 보트 투어는 크루즈 승객에게 훌륭한 옵션입니다."
        },
        "it": {
          "portName": "Terminal Crociere di Stoccolma",
          "distanceFromCity": "Nel centro città",
          "recommendedDuration": "6-8 ore",
          "tips": "Il porto delle crociere è situato centralmente. Cammina fino a Gamla Stan (Città Vecchia) o prendi un breve traghetto per visitare i musei. Il tour in barca hop-on-hop-off è un'ottima opzione per i passeggeri delle crociere."
        }
      }
    },
    "landingContent": null,
    "defaultGuideId": null,
    "createdAt": "2026-02-12T11:40:37.665Z",
    "updatedAt": "2026-02-22T18:05:44.755Z"
  },
  {
    "id": "civitavecchia",
    "name": "Civitavecchia",
    "country": "Italy",
    "lat": 42.0924,
    "lng": 11.7954,
    "zoom": 13,
    "cruisePort": null,
    "landingContent": {
      "en": {
        "title": "Civitavecchia: Gateway to Rome",
        "subTitle": "Charming Port City and Your Journey's Start",
        "heroImage": "https://images.unsplash.com/photo-1624835848527-0c7da796a5af?w=1200"
      },
      "ko": {
        "title": "치비타베키아: 로마로 가는 관문",
        "subTitle": "항구 도시의 매력과 편안한 여행의 시작",
        "heroImage": "https://images.unsplash.com/photo-1624835848527-0c7da796a5af?w=1200"
      }
    },
    "defaultGuideId": null,
    "createdAt": "2026-02-19T22:50:53.546Z",
    "updatedAt": "2026-02-22T18:05:45.637Z"
  }
];
