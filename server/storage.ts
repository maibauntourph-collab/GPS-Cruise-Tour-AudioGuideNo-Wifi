import { type Landmark, type City, type VisitedLandmark, type InsertVisitedLandmark, type LandmarkAudio, type InsertLandmarkAudio } from "@shared/schema";
import { db } from "./db";
import { visitedLandmarks, landmarkAudio as landmarkAudioTable } from "@shared/schema";
import { eq, count, and, sql } from "drizzle-orm";
import { RESTAURANTS } from "./data/restaurants";

export interface IStorage {
  getCities(): Promise<City[]>;
  getCity(id: string): Promise<City | undefined>;
  getLandmarks(cityId?: string): Promise<Landmark[]>;
  getLandmark(id: string): Promise<Landmark | undefined>;
  // Visited landmarks methods
  markLandmarkVisited(landmarkId: string, sessionId?: string): Promise<VisitedLandmark>;
  getVisitedLandmarks(sessionId?: string): Promise<VisitedLandmark[]>;
  isLandmarkVisited(landmarkId: string, sessionId?: string): Promise<boolean>;
  getVisitedCount(sessionId?: string): Promise<number>;
  // Audio methods
  getAudio(landmarkId: string, language: string): Promise<LandmarkAudio | undefined>;
  getAudioByCity(cityId: string): Promise<LandmarkAudio[]>;
  saveAudio(audio: InsertLandmarkAudio): Promise<LandmarkAudio>;
  deleteAudio(landmarkId: string, language: string): Promise<void>;
}

const CITIES: City[] = [
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italy',
    lat: 41.8902,
    lng: 12.4922,
    zoom: 14,
    cruisePort: {
      portName: 'Civitavecchia Port',
      distanceFromCity: '80km from Rome',
      recommendedDuration: '7-8 hours',
      recommendedLandmarks: ['colosseum', 'vatican_museums', 'trevi-fountain', 'pantheon', 'roman-forum'],
      tips: '⚠️ IMPORTANT: Always check your ship\'s boarding time and plan to return 1-2 hours early. Book a shore excursion in advance or take the train from Civitavecchia to Rome (80 minutes). Start early to see the main attractions. Consider skip-the-line tickets for the Vatican and Colosseum. If using a tender boat to reach port, get your tender ticket from the cruise ship in advance.',
      portCoordinates: {
        lat: 42.0943,
        lng: 11.7967
      },
      transportOptions: [
        {
          type: 'train',
          name: 'Trenitalia Regional Train',
          from: 'Civitavecchia Station',
          to: 'Roma Termini / Roma San Pietro',
          duration: '60-80 minutes',
          frequency: 'Every 30-60 minutes',
          price: '€5-15',
          bookingUrl: 'https://www.trenitalia.com',
          tips: 'Station is 700m from port (10min walk or free shuttle). Buy tickets at station or online. Validate ticket before boarding.',
          translations: {
            ko: {
              name: 'Trenitalia 지역 기차',
              from: '치비타베키아역',
              to: '로마 테르미니 / 로마 산 피에트로',
              duration: '60-80분',
              frequency: '30-60분마다',
              price: '€5-15',
              tips: '역은 항구에서 700m (도보 10분 또는 무료 셔틀). 역이나 온라인에서 티켓 구매. 탑승 전 티켓 검증 필수.'
            },
            it: {
              name: 'Treno Regionale Trenitalia',
              from: 'Stazione di Civitavecchia',
              to: 'Roma Termini / Roma San Pietro',
              duration: '60-80 minuti',
              frequency: 'Ogni 30-60 minuti',
              price: '€5-15',
              tips: 'La stazione dista 700m dal porto (10min a piedi o navetta gratuita). Acquista i biglietti in stazione o online. Convalida il biglietto prima di salire.'
            }
          }
        },
        {
          type: 'shuttle',
          name: 'Shore Excursion Shuttle',
          from: 'Civitavecchia Port',
          to: 'Rome City Center',
          duration: '90 minutes',
          frequency: 'Based on cruise schedule',
          price: '€20-40 per person',
          bookingUrl: 'https://www.getyourguide.com',
          tips: 'Book through your cruise line or GetYourGuide. Includes round-trip transportation.',
          translations: {
            ko: {
              name: '기항지 투어 셔틀',
              from: '치비타베키아 항구',
              to: '로마 시내',
              duration: '90분',
              frequency: '크루즈 일정에 따라',
              price: '1인당 €20-40',
              tips: '크루즈 라인이나 GetYourGuide를 통해 예약. 왕복 교통 포함.'
            },
            it: {
              name: 'Navetta Escursione a Terra',
              from: 'Porto di Civitavecchia',
              to: 'Centro di Roma',
              duration: '90 minuti',
              frequency: 'In base al programma della crociera',
              price: '€20-40 a persona',
              tips: 'Prenota tramite la tua compagnia di crociera o GetYourGuide. Include trasporto andata e ritorno.'
            }
          }
        },
        {
          type: 'taxi',
          name: 'Private Taxi',
          from: 'Civitavecchia Port',
          to: 'Rome City Center',
          duration: '60-75 minutes',
          frequency: 'On demand',
          price: '€120-150 (fixed rate)',
          tips: 'Official white taxis available at port exit. Agree on price before departure. Fits 4 passengers + luggage.',
          translations: {
            ko: {
              name: '개인 택시',
              from: '치비타베키아 항구',
              to: '로마 시내',
              duration: '60-75분',
              frequency: '수시',
              price: '€120-150 (고정 요금)',
              tips: '항구 출구에서 공식 흰색 택시 이용 가능. 출발 전 요금 합의. 승객 4명 + 짐 탑승 가능.'
            },
            it: {
              name: 'Taxi Privato',
              from: 'Porto di Civitavecchia',
              to: 'Centro di Roma',
              duration: '60-75 minuti',
              frequency: 'Su richiesta',
              price: '€120-150 (tariffa fissa)',
              tips: 'Taxi bianchi ufficiali disponibili all\'uscita del porto. Concordare il prezzo prima della partenza. Può ospitare 4 passeggeri + bagagli.'
            }
          }
        },
        {
          type: 'rideshare',
          name: 'Uber / Bolt',
          from: 'Civitavecchia Port',
          to: 'Rome City Center',
          duration: '60-75 minutes',
          frequency: 'On demand via app',
          price: '€80-120',
          tips: 'Use Uber or Bolt app to request ride from port. Price varies by demand. Payment handled through app.',
          translations: {
            ko: {
              name: '우버 / 볼트',
              from: '치비타베키아 항구',
              to: '로마 시내',
              duration: '60-75분',
              frequency: '앱을 통한 수시',
              price: '€80-120',
              tips: 'Uber 또는 Bolt 앱으로 항구에서 차량 요청. 수요에 따라 가격 변동. 앱으로 결제 처리.'
            },
            it: {
              name: 'Uber / Bolt',
              from: 'Porto di Civitavecchia',
              to: 'Centro di Roma',
              duration: '60-75 minuti',
              frequency: 'Su richiesta tramite app',
              price: '€80-120',
              tips: 'Usa l\'app Uber o Bolt per richiedere una corsa dal porto. Il prezzo varia in base alla domanda. Pagamento gestito tramite app.'
            }
          }
        }
      ],
      translations: {
        ko: {
          portName: '치비타베키아 항구',
          distanceFromCity: '로마에서 80km',
          recommendedDuration: '7-8시간',
          tips: '⚠️ 중요: 항상 선박 승선 시간을 확인하고 1-2시간 일찍 돌아올 계획을 세우세요. 미리 기항지 관광을 예약하거나 치비타베키아에서 로마까지 기차를 이용하세요 (80분 소요). 주요 명소를 보려면 일찍 출발하세요. 바티칸과 콜로세움은 줄서기 패스 티켓을 고려하세요. 텐더보트를 이용해 항구로 나가야 하는 경우, 크루즈에서 미리 텐더티켓을 받아 준비하세요.'
        },
        it: {
          portName: 'Porto di Civitavecchia',
          distanceFromCity: '80km da Roma',
          recommendedDuration: '7-8 ore',
          tips: '⚠️ IMPORTANTE: Controlla sempre l\'orario di imbarco della nave e pianifica di tornare 1-2 ore prima. Prenota un\'escursione in anticipo o prendi il treno da Civitavecchia a Roma (80 minuti). Parti presto per vedere le principali attrazioni. Considera i biglietti salta fila per il Vaticano e il Colosseo. Se usi una tender boat per raggiungere il porto, ottieni il biglietto tender dalla nave in anticipo.'
        }
      }
    }
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    lat: 48.8566,
    lng: 2.3522,
    zoom: 13
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    lat: 51.5074,
    lng: -0.1278,
    zoom: 13
  },
  {
    id: 'anchorage',
    name: 'Anchorage',
    country: 'USA',
    lat: 61.2181,
    lng: -149.9003,
    zoom: 13
  },
  {
    id: 'amsterdam',
    name: 'Amsterdam',
    country: 'Netherlands',
    lat: 52.3676,
    lng: 4.9041,
    zoom: 13
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    lat: 41.3851,
    lng: 2.1734,
    zoom: 13,
    cruisePort: {
      portName: 'Port of Barcelona',
      distanceFromCity: 'Right in the city center',
      recommendedDuration: '6-8 hours',
      recommendedLandmarks: ['sagrada-familia', 'park-guell', 'gothic-quarter'],
      tips: '⚠️ IMPORTANT: Always check your ship\'s boarding time and plan to return 1-2 hours early. The cruise port is very close to Las Ramblas and the Gothic Quarter. Use the shuttle bus or taxi to reach Sagrada Familia. Buy tickets online in advance to avoid long queues. If using a tender boat to reach port, get your tender ticket from the cruise ship in advance.',
      portCoordinates: {
        lat: 41.3652,
        lng: 2.1774
      },
      transportOptions: [
        {
          type: 'shuttle',
          name: 'Port Shuttle Bus (Blue Bus)',
          from: 'Cruise Terminal',
          to: 'Columbus Monument (Las Ramblas)',
          duration: '15 minutes',
          frequency: 'Every 20-30 minutes',
          price: '€3 per person',
          tips: 'Free shuttle often provided by cruise lines. Otherwise use the Blue Bus (Porta Bus). Runs when ships are in port.',
          translations: {
            ko: {
              name: '항구 셔틀버스 (블루 버스)',
              from: '크루즈 터미널',
              to: '콜럼버스 기념비 (람블라스 거리)',
              duration: '15분',
              frequency: '20-30분마다',
              price: '1인당 €3',
              tips: '크루즈 라인이 무료 셔틀을 제공하는 경우가 많습니다. 그렇지 않으면 블루 버스(Porta Bus) 이용. 배가 정박할 때만 운행.'
            },
            it: {
              name: 'Navetta del Porto (Bus Blu)',
              from: 'Terminal Crociere',
              to: 'Monumento a Colombo (Las Ramblas)',
              duration: '15 minuti',
              frequency: 'Ogni 20-30 minuti',
              price: '€3 a persona',
              tips: 'Navetta gratuita spesso fornita dalle compagnie di crociera. Altrimenti usa il Bus Blu (Porta Bus). Funziona quando le navi sono in porto.'
            }
          }
        },
        {
          type: 'bus',
          name: 'Hop-on Hop-off Barcelona Bus Turístic',
          from: 'Port (World Trade Center)',
          to: 'Sagrada Familia, Park Güell, Gothic Quarter',
          duration: 'Full day pass',
          frequency: 'Every 10-15 minutes',
          price: '€32-35 per day',
          bookingUrl: 'https://www.barcelona-tourist-guide.com/en/bus-tourist/barcelona-bus-turistic.html',
          tips: 'Best option for cruise passengers. Covers all major attractions. Buy tickets online for discount. Audio guide in 15 languages.',
          translations: {
            ko: {
              name: 'Hop-on Hop-off 바르셀로나 버스 투리스틱',
              from: '항구 (월드 트레이드 센터)',
              to: '사그라다 파밀리아, 구엘 공원, 고딕 지구',
              duration: '1일 패스',
              frequency: '10-15분마다',
              price: '1일 €32-35',
              tips: '크루즈 승객에게 최고의 옵션. 모든 주요 명소 포함. 온라인 티켓 구매 시 할인. 15개 언어 오디오 가이드.'
            },
            it: {
              name: 'Hop-on Hop-off Barcelona Bus Turístic',
              from: 'Porto (World Trade Center)',
              to: 'Sagrada Familia, Park Güell, Quartiere Gotico',
              duration: 'Pass giornaliero',
              frequency: 'Ogni 10-15 minuti',
              price: '€32-35 al giorno',
              tips: 'Opzione migliore per i passeggeri delle crociere. Copre tutte le attrazioni principali. Acquista i biglietti online per lo sconto. Audioguida in 15 lingue.'
            }
          }
        },
        {
          type: 'bus',
          name: 'Metro L3 (Green Line)',
          from: 'Drassanes Station (15min walk from port)',
          to: 'Sagrada Familia, Passeig de Gràcia',
          duration: '20-30 minutes',
          frequency: 'Every 5-10 minutes',
          price: '€2.40 single / €11.35 for 10 trips',
          bookingUrl: 'https://www.tmb.cat/en/home',
          tips: 'Most economical option. Walk to Drassanes station or take shuttle bus first. Buy T-10 ticket for multiple trips.',
          translations: {
            ko: {
              name: '메트로 L3 (녹색 라인)',
              from: 'Drassanes 역 (항구에서 도보 15분)',
              to: '사그라다 파밀리아, 그라시아 거리',
              duration: '20-30분',
              frequency: '5-10분마다',
              price: '편도 €2.40 / 10회권 €11.35',
              tips: '가장 경제적인 옵션. Drassanes 역까지 걸어가거나 먼저 셔틀버스 이용. 여러 번 이용 시 T-10 티켓 구매.'
            },
            it: {
              name: 'Metro L3 (Linea Verde)',
              from: 'Stazione Drassanes (15min a piedi dal porto)',
              to: 'Sagrada Familia, Passeig de Gràcia',
              duration: '20-30 minuti',
              frequency: 'Ogni 5-10 minuti',
              price: '€2.40 singolo / €11.35 per 10 viaggi',
              tips: 'Opzione più economica. Cammina fino alla stazione Drassanes o prendi prima la navetta. Acquista il biglietto T-10 per più viaggi.'
            }
          }
        },
        {
          type: 'shuttle',
          name: 'GetYourGuide Shore Excursion',
          from: 'Barcelona Cruise Port',
          to: 'Guided City Tour (Sagrada Familia, Gothic Quarter, etc.)',
          duration: '4-8 hours',
          frequency: 'Based on booking',
          price: '€45-150 per person',
          bookingUrl: 'https://www.getyourguide.com/barcelona-l45/shore-excursions-tc147/',
          tips: 'Pre-arranged tours guarantee return to ship on time. Includes skip-the-line tickets. Book 48 hours in advance.',
          translations: {
            ko: {
              name: 'GetYourGuide 기항지 투어',
              from: '바르셀로나 크루즈 포트',
              to: '가이드 시티 투어 (사그라다 파밀리아, 고딕 지구 등)',
              duration: '4-8시간',
              frequency: '예약에 따라',
              price: '1인당 €45-150',
              tips: '사전 예약 투어로 정시 복귀 보장. 줄서기 패스 티켓 포함. 48시간 전 예약.'
            },
            it: {
              name: 'GetYourGuide Escursione a Terra',
              from: 'Porto Crociere di Barcellona',
              to: 'Tour Guidato della Città (Sagrada Familia, Quartiere Gotico, ecc.)',
              duration: '4-8 ore',
              frequency: 'In base alla prenotazione',
              price: '€45-150 a persona',
              tips: 'I tour preordinati garantiscono il rientro in nave in tempo. Include biglietti salta fila. Prenota 48 ore prima.'
            }
          }
        },
        {
          type: 'taxi',
          name: 'Official Taxi',
          from: 'Cruise Terminal',
          to: 'Any city destination',
          duration: '10-30 minutes depending on destination',
          frequency: 'On demand',
          price: '€15-30 to city center',
          tips: 'Official yellow and black taxis available at terminal exit. Meter-based pricing. Ask for receipt.',
          translations: {
            ko: {
              name: '공식 택시',
              from: '크루즈 터미널',
              to: '모든 도시 목적지',
              duration: '목적지에 따라 10-30분',
              frequency: '수시',
              price: '시내까지 €15-30',
              tips: '터미널 출구에서 공식 노란색과 검은색 택시 이용 가능. 미터기 요금. 영수증 요청.'
            },
            it: {
              name: 'Taxi Ufficiale',
              from: 'Terminal Crociere',
              to: 'Qualsiasi destinazione in città',
              duration: '10-30 minuti a seconda della destinazione',
              frequency: 'Su richiesta',
              price: '€15-30 per il centro città',
              tips: 'Taxi ufficiali gialli e neri disponibili all\'uscita del terminal. Prezzo al tassametro. Chiedi la ricevuta.'
            }
          }
        },
        {
          type: 'rideshare',
          name: 'Uber / Cabify',
          from: 'Barcelona Cruise Port',
          to: 'City Center',
          duration: '15-25 minutes',
          frequency: 'On demand via app',
          price: '€12-25',
          tips: 'Use Uber or Cabify app. Cabify is popular in Barcelona. Price varies by demand. Pickup at designated area.',
          translations: {
            ko: {
              name: '우버 / 캐비파이',
              from: '바르셀로나 크루즈 포트',
              to: '시내',
              duration: '15-25분',
              frequency: '앱을 통한 수시',
              price: '€12-25',
              tips: 'Uber 또는 Cabify 앱 사용. Cabify가 바르셀로나에서 인기. 수요에 따라 가격 변동. 지정된 구역에서 픽업.'
            },
            it: {
              name: 'Uber / Cabify',
              from: 'Porto Crociere di Barcellona',
              to: 'Centro Città',
              duration: '15-25 minuti',
              frequency: 'Su richiesta tramite app',
              price: '€12-25',
              tips: 'Usa l\'app Uber o Cabify. Cabify è popolare a Barcellona. Il prezzo varia in base alla domanda. Ritiro nell\'area designata.'
            }
          }
        }
      ],
      translations: {
        ko: {
          portName: '바르셀로나 항구',
          distanceFromCity: '도심 바로 근처',
          recommendedDuration: '6-8시간',
          tips: '⚠️ 중요: 항상 선박 승선 시간을 확인하고 1-2시간 일찍 돌아올 계획을 세우세요. 크루즈 항구는 람블라스 거리와 고딕 지구에서 매우 가깝습니다. 셔틀버스나 택시를 이용하여 사그라다 파밀리아에 도달하세요. 긴 줄을 피하려면 온라인으로 미리 티켓을 구매하세요. 텐더보트를 이용해 항구로 나가야 하는 경우, 크루즈에서 미리 텐더티켓을 받아 준비하세요.'
        },
        it: {
          portName: 'Porto di Barcellona',
          distanceFromCity: 'Proprio nel centro città',
          recommendedDuration: '6-8 ore',
          tips: '⚠️ IMPORTANTE: Controlla sempre l\'orario di imbarco della nave e pianifica di tornare 1-2 ore prima. Il porto delle crociere è molto vicino a Las Ramblas e al Quartiere Gotico. Usa il bus navetta o il taxi per raggiungere la Sagrada Familia. Acquista i biglietti online in anticipo per evitare lunghe code. Se usi una tender boat per raggiungere il porto, ottieni il biglietto tender dalla nave in anticipo.'
        }
      }
    }
  },
  {
    id: 'brussels',
    name: 'Brussels',
    country: 'Belgium',
    lat: 50.8503,
    lng: 4.3517,
    zoom: 13
  },
  {
    id: 'prague',
    name: 'Prague',
    country: 'Czech Republic',
    lat: 50.0755,
    lng: 14.4378,
    zoom: 13
  },
  {
    id: 'budapest',
    name: 'Budapest',
    country: 'Hungary',
    lat: 47.4979,
    lng: 19.0402,
    zoom: 13
  },
  {
    id: 'warsaw',
    name: 'Warsaw',
    country: 'Poland',
    lat: 52.2297,
    lng: 21.0122,
    zoom: 13
  },
  {
    id: 'stockholm',
    name: 'Stockholm',
    country: 'Sweden',
    lat: 59.3293,
    lng: 18.0686,
    zoom: 13,
    cruisePort: {
      portName: 'Stockholm Cruise Terminal',
      distanceFromCity: 'In the city center',
      recommendedDuration: '6-8 hours',
      recommendedLandmarks: ['vasa-museum', 'gamla-stan', 'royal-palace-stockholm'],
      tips: 'The cruise port is centrally located. Walk to Gamla Stan (Old Town) or take a short ferry to visit museums. The hop-on-hop-off boat tour is a great option for cruise passengers.',
      translations: {
        ko: {
          portName: '스톡홀름 크루즈 터미널',
          distanceFromCity: '도심',
          recommendedDuration: '6-8시간',
          tips: '크루즈 항구는 중심부에 위치해 있습니다. 감라 스탄(구시가지)까지 걸어가거나 박물관 방문을 위해 짧은 페리를 이용하세요. 홉온홉오프 보트 투어는 크루즈 승객에게 훌륭한 옵션입니다.'
        },
        it: {
          portName: 'Terminal Crociere di Stoccolma',
          distanceFromCity: 'Nel centro città',
          recommendedDuration: '6-8 ore',
          tips: 'Il porto delle crociere è situato centralmente. Cammina fino a Gamla Stan (Città Vecchia) o prendi un breve traghetto per visitare i musei. Il tour in barca hop-on-hop-off è un\'ottima opzione per i passeggeri delle crociere.'
        }
      }
    }
  },
  {
    id: 'copenhagen',
    name: 'Copenhagen',
    country: 'Denmark',
    lat: 55.6761,
    lng: 12.5683,
    zoom: 13,
    cruisePort: {
      portName: 'Copenhagen Cruise Terminal',
      distanceFromCity: 'Walking distance to city center',
      recommendedDuration: '6-8 hours',
      recommendedLandmarks: ['tivoli-gardens', 'nyhavn', 'little-mermaid'],
      tips: 'The cruise terminal is within walking distance of Nyhavn and the Little Mermaid. Rent a bike to explore like a local or take a canal tour to see the city from the water.',
      translations: {
        ko: {
          portName: '코펜하겐 크루즈 터미널',
          distanceFromCity: '도심까지 도보 거리',
          recommendedDuration: '6-8시간',
          tips: '크루즈 터미널은 뉘하운과 인어공주 동상까지 도보 거리에 있습니다. 현지인처럼 자전거를 빌려 탐험하거나 운하 투어를 통해 물에서 도시를 보세요.'
        },
        it: {
          portName: 'Terminal Crociere di Copenaghen',
          distanceFromCity: 'A piedi dal centro città',
          recommendedDuration: '6-8 ore',
          tips: 'Il terminal delle crociere è a poca distanza a piedi da Nyhavn e dalla Sirenetta. Noleggia una bici per esplorare come un locale o fai un tour dei canali per vedere la città dall\'acqua.'
        }
      }
    }
  },
  {
    id: 'oslo',
    name: 'Oslo',
    country: 'Norway',
    lat: 59.9139,
    lng: 10.7522,
    zoom: 13
  },
  {
    id: 'cebu',
    name: 'Cebu',
    country: 'Philippines',
    lat: 10.3157,
    lng: 123.8854,
    zoom: 13
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    lat: 1.2897,
    lng: 103.8501,
    zoom: 13,
    cruisePort: {
      portName: 'Marina Bay Cruise Centre',
      distanceFromCity: 'In the city',
      recommendedDuration: '6-8 hours',
      recommendedLandmarks: ['merlion', 'marina-bay-sands', 'gardens-by-the-bay', 'singapore-flyer', 'chinatown-sg'],
      tips: 'The cruise terminal is near Marina Bay. Gardens by the Bay and the Merlion are within walking distance. Use the MRT (subway) for efficient travel. Visit Chinatown or Little India for cultural experiences.',
      translations: {
        ko: {
          portName: '마리나 베이 크루즈 센터',
          distanceFromCity: '도심',
          recommendedDuration: '6-8시간',
          tips: '크루즈 터미널은 마리나 베이 근처에 있습니다. 가든스 바이 더 베이와 멀라이언은 도보 거리에 있습니다. 효율적인 이동을 위해 MRT(지하철)를 이용하세요. 문화 체험을 위해 차이나타운이나 리틀 인디아를 방문하세요.'
        },
        it: {
          portName: 'Marina Bay Cruise Centre',
          distanceFromCity: 'In città',
          recommendedDuration: '6-8 ore',
          tips: 'Il terminal delle crociere è vicino a Marina Bay. Gardens by the Bay e il Merlion sono raggiungibili a piedi. Usa la MRT (metropolitana) per viaggiare in modo efficiente. Visita Chinatown o Little India per esperienze culturali.'
        }
      }
    }
  },
  {
    id: 'penang',
    name: 'Penang',
    country: 'Malaysia',
    lat: 5.4164,
    lng: 100.3327,
    zoom: 13
  },
  {
    id: 'kuala-lumpur',
    name: 'Kuala Lumpur',
    country: 'Malaysia',
    lat: 3.1390,
    lng: 101.6869,
    zoom: 13
  },
  {
    id: 'phuket',
    name: 'Phuket',
    country: 'Thailand',
    lat: 7.8804,
    lng: 98.3923,
    zoom: 13
  }
];

const LANDMARKS: Landmark[] = [
  // Rome landmarks
  {
    id: 'colosseum',
    cityId: 'rome',
    name: 'Colosseum',
    lat: 41.890251,
    lng: 12.492373,
    radius: 70,
    narration: 'Welcome to the Colosseum, the iconic symbol of Rome. This ancient amphitheater once hosted gladiatorial contests and public spectacles.',
    description: 'The largest amphitheater ever built, a UNESCO World Heritage Site',
    category: 'Ancient Rome',
    detailedDescription: 'The Colosseum, also known as the Flavian Amphitheatre, stands as one of the greatest architectural achievements of ancient Rome and remains the largest amphitheater ever constructed. Built between 70-80 AD under Emperors Vespasian and Titus, this magnificent elliptical structure could accommodate between 50,000 to 80,000 spectators who came to witness gladiatorial contests, animal hunts, mock naval battles, and public executions. The name "Colosseum" likely derives from the colossal bronze statue of Nero that once stood nearby. Constructed primarily of travertine limestone blocks, volcanic tuff, and brick-faced concrete, the Colosseum showcases the engineering brilliance of Roman architecture. Its innovative design featured a complex system of vaults and arches that distributed weight efficiently, allowing for its massive four-story facade. The exterior was adorned with Doric, Ionic, and Corinthian columns on successive levels, demonstrating the Romans mastery of classical architectural orders. The arena floor, once covered with wooden planking and sand, concealed an elaborate underground network called the hypogeum - a two-level subterranean complex of tunnels and chambers where gladiators, animals, and stage equipment were housed and prepared for the spectacles above. A sophisticated system of pulleys, ramps, and trapdoors allowed for dramatic entrances and special effects during performances. The Colosseum also featured a retractable awning system called the velarium, operated by sailors from the Roman navy, which provided shade for spectators during events. Despite suffering damage from earthquakes, stone-robbers who repurposed its materials for other buildings, and the general passage of time, the Colosseum has endured as a powerful symbol of Imperial Rome and ancient civilization. Today, it stands as one of Rome\'s most popular tourist attractions and a UNESCO World Heritage Site, drawing millions of visitors annually who come to marvel at this extraordinary monument to Roman engineering and entertainment.',
    photos: [
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=800',
      'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=800',
      'https://images.unsplash.com/photo-1546961342-ea5f71b193f3?w=800'
    ],
    historicalInfo: 'The Colosseum, also known as the Flavian Amphitheatre, is an oval amphitheatre in the centre of Rome. Built of travertine limestone, tuff, and brick-faced concrete, it was the largest amphitheatre ever built at the time and held 50,000 to 80,000 spectators.',
    yearBuilt: '70-80 AD',
    architect: 'Emperors Vespasian and Titus',
    translations: {
      en: {
        name: 'Colosseum',
        narration: 'Welcome to the Colosseum, the iconic symbol of Rome. This ancient amphitheater once hosted gladiatorial contests and public spectacles.',
        description: 'The largest amphitheater ever built, a UNESCO World Heritage Site',
        detailedDescription: 'The Colosseum, also known as the Flavian Amphitheatre, stands as one of the greatest architectural achievements of ancient Rome and remains the largest amphitheater ever constructed. Built between 70-80 AD under Emperors Vespasian and Titus, this magnificent elliptical structure could accommodate between 50,000 to 80,000 spectators who came to witness gladiatorial contests, animal hunts, mock naval battles, and public executions. The name "Colosseum" likely derives from the colossal bronze statue of Nero that once stood nearby. Constructed primarily of travertine limestone blocks, volcanic tuff, and brick-faced concrete, the Colosseum showcases the engineering brilliance of Roman architecture. Its innovative design featured a complex system of vaults and arches that distributed weight efficiently, allowing for its massive four-story facade. The exterior was adorned with Doric, Ionic, and Corinthian columns on successive levels, demonstrating the Romans mastery of classical architectural orders. The arena floor, once covered with wooden planking and sand, concealed an elaborate underground network called the hypogeum - a two-level subterranean complex of tunnels and chambers where gladiators, animals, and stage equipment were housed and prepared for the spectacles above. A sophisticated system of pulleys, ramps, and trapdoors allowed for dramatic entrances and special effects during performances. The Colosseum also featured a retractable awning system called the velarium, operated by sailors from the Roman navy, which provided shade for spectators during events. Despite suffering damage from earthquakes, stone-robbers who repurposed its materials for other buildings, and the general passage of time, the Colosseum has endured as a powerful symbol of Imperial Rome and ancient civilization. Today, it stands as one of Rome\'s most popular tourist attractions and a UNESCO World Heritage Site, drawing millions of visitors annually who come to marvel at this extraordinary monument to Roman engineering and entertainment.',
        historicalInfo: 'The Colosseum, also known as the Flavian Amphitheatre, is an oval amphitheatre in the centre of Rome. Built of travertine limestone, tuff, and brick-faced concrete, it was the largest amphitheatre ever built at the time and held 50,000 to 80,000 spectators.',
        yearBuilt: '70-80 AD',
        architect: 'Emperors Vespasian and Titus'
      },
      it: {
        name: 'Colosseo',
        narration: 'Benvenuto al Colosseo, il simbolo iconico di Roma. Questo antico anfiteatro ospitava combattimenti tra gladiatori e spettacoli pubblici.',
        description: 'Il più grande anfiteatro mai costruito, patrimonio mondiale dell\'UNESCO',
        detailedDescription: 'Il Colosseo, conosciuto anche come Anfiteatro Flavio, rappresenta uno dei più grandi risultati architettonici dell\'antica Roma e rimane il più grande anfiteatro mai costruito. Edificato tra il 70 e l\'80 d.C. sotto gli imperatori Vespasiano e Tito, questa magnifica struttura ellittica poteva ospitare tra 50.000 e 80.000 spettatori che venivano ad assistere a combattimenti tra gladiatori, cacce di animali, battaglie navali simulate ed esecuzioni pubbliche. Il nome "Colosseo" deriva probabilmente dalla colossale statua in bronzo di Nerone che un tempo si ergeva nelle vicinanze. Costruito principalmente con blocchi di pietra calcarea travertino, tufo vulcanico e cemento rivestito di mattoni, il Colosseo mostra la genialità ingegneristica dell\'architettura romana. Il suo design innovativo presentava un complesso sistema di volte e archi che distribuivano il peso in modo efficiente, consentendo la sua massiccia facciata a quattro piani. L\'esterno era adornato con colonne doriche, ioniche e corinzie su livelli successivi, dimostrando la padronanza romana degli ordini architettonici classici. Il pavimento dell\'arena, un tempo coperto da assi di legno e sabbia, nascondeva un\'elaborata rete sotterranea chiamata ipogeo - un complesso sotterraneo a due livelli di tunnel e camere dove gladiatori, animali e attrezzature sceniche venivano ospitati e preparati per gli spettacoli soprastanti. Un sofisticato sistema di carrucole, rampe e botole permetteva ingressi drammatici ed effetti speciali durante le rappresentazioni. Il Colosseo disponeva anche di un sistema di tende retrattili chiamato velarium, gestito da marinai della marina romana, che forniva ombra agli spettatori durante gli eventi. Nonostante i danni subiti da terremoti, saccheggiatori di pietra che ne hanno riutilizzato i materiali per altri edifici e il generale trascorrere del tempo, il Colosseo è rimasto un potente simbolo della Roma imperiale e della civiltà antica. Oggi si erge come una delle attrazioni turistiche più popolari di Roma e un sito patrimonio mondiale dell\'UNESCO, attirando milioni di visitatori ogni anno che vengono ad ammirare questo straordinario monumento all\'ingegneria e all\'intrattenimento romano.',
        historicalInfo: 'Il Colosseo, conosciuto anche come Anfiteatro Flavio, è un anfiteatro ovale nel centro di Roma. Costruito in pietra calcarea travertino, tufo e cemento rivestito di mattoni, era il più grande anfiteatro mai costruito all\'epoca e ospitava da 50.000 a 80.000 spettatori.',
        yearBuilt: '70-80 d.C.',
        architect: 'Imperatori Vespasiano e Tito'
      },
      ko: {
        name: '콜로세움',
        narration: '로마의 상징인 콜로세움에 오신 것을 환영합니다. 이 고대 원형 경기장은 한때 검투사 경기와 공개 행사를 개최했습니다.',
        description: '역사상 가장 큰 원형 경기장이자 유네스코 세계문화유산',
        detailedDescription: '플라비우스 원형극장으로도 알려진 콜로세움은 고대 로마의 가장 위대한 건축적 성취 중 하나로 남아있으며, 지금까지 건설된 가장 큰 원형 경기장입니다. 서기 70-80년 베스파시아누스와 티투스 황제 치하에 건설된 이 웅장한 타원형 구조물은 검투사 경기, 동물 사냥, 모의 해전, 공개 처형을 관람하러 온 5만에서 8만 명의 관중을 수용할 수 있었습니다. "콜로세움"이라는 이름은 근처에 서 있던 네로의 거대한 청동 조각상에서 유래했을 가능성이 큽니다. 주로 석회암 블록, 화산 응회암, 벽돌로 된 콘크리트로 건설된 콜로세움은 로마 건축의 공학적 우수성을 보여줍니다. 혁신적인 설계는 무게를 효율적으로 분산시키는 복잡한 볼트와 아치 시스템을 특징으로 하여 거대한 4층 파사드를 가능하게 했습니다. 외부는 연속적인 층에 도리아식, 이오니아식, 코린트식 기둥으로 장식되어 로마인들의 고전 건축 양식 숙달을 보여줍니다. 한때 나무 판자와 모래로 덮여 있던 경기장 바닥은 하이포지움이라고 불리는 정교한 지하 네트워크를 숨기고 있었습니다 - 검투사, 동물, 무대 장비가 보관되고 위의 공연을 위해 준비되던 2층 지하 터널과 방으로 이루어진 복합 공간이었습니다. 정교한 도르래, 경사로, 함정문 시스템은 공연 중 극적인 등장과 특수 효과를 가능하게 했습니다. 콜로세움은 또한 로마 해군의 선원들이 작동하는 벨라리움이라는 개폐식 차양 시스템을 갖추고 있어 행사 중 관중에게 그늘을 제공했습니다. 지진, 다른 건물에 자재를 재사용한 약탈자들, 그리고 시간의 경과로 인한 피해에도 불구하고, 콜로세움은 로마 제국과 고대 문명의 강력한 상징으로 남아있습니다. 오늘날 로마에서 가장 인기 있는 관광 명소이자 유네스코 세계문화유산으로 서 있으며, 매년 수백만 명의 방문객이 로마 공학과 오락의 이 특별한 기념물을 감상하러 옵니다.',
        historicalInfo: '플라비우스 원형극장으로도 알려진 콜로세움은 로마 중심부에 위치한 타원형 원형 경기장입니다. 석회암, 응회암, 벽돌 콘크리트로 건설되었으며, 당시 건설된 가장 큰 원형 경기장으로 5만에서 8만 명의 관중을 수용했습니다.',
        yearBuilt: '서기 70-80년',
        architect: '베스파시아누스 황제와 티투스 황제'
      },
      es: {
        name: 'Coliseo',
        narration: 'Bienvenido al Coliseo, el símbolo icónico de Roma. Este antiguo anfiteatro albergó combates de gladiadores y espectáculos públicos.',
        description: 'El anfiteatro más grande jamás construido, Patrimonio de la Humanidad de la UNESCO',
        detailedDescription: 'El Coliseo, también conocido como el Anfiteatro Flavio, se erige como uno de los mayores logros arquitectónicos de la antigua Roma y sigue siendo el anfiteatro más grande jamás construido. Construido entre los años 70-80 d.C. bajo los emperadores Vespasiano y Tito, esta magnífica estructura elíptica podía albergar entre 50.000 y 80.000 espectadores que venían a presenciar combates de gladiadores, cacerías de animales, batallas navales simuladas y ejecuciones públicas. El nombre "Coliseo" probablemente deriva de la colosal estatua de bronce de Nerón que una vez se alzó cerca. Construido principalmente con bloques de piedra caliza travertino, toba volcánica y hormigón revestido de ladrillos, el Coliseo muestra la brillantez ingenieril de la arquitectura romana. Su diseño innovador presentaba un complejo sistema de bóvedas y arcos que distribuían el peso de manera eficiente, permitiendo su enorme fachada de cuatro pisos. El exterior estaba adornado con columnas dóricas, jónicas y corintias en niveles sucesivos, demostrando el dominio romano de los órdenes arquitectónicos clásicos. El suelo de la arena, una vez cubierto con tablas de madera y arena, ocultaba una elaborada red subterránea llamada hipogeo, un complejo subterráneo de dos niveles con túneles y cámaras donde se alojaban y preparaban los gladiadores, animales y equipos escénicos para los espectáculos de arriba. Un sofisticado sistema de poleas, rampas y trampillas permitía entradas dramáticas y efectos especiales durante las actuaciones. El Coliseo también contaba con un sistema de toldos retráctiles llamado velarium, operado por marineros de la armada romana, que proporcionaba sombra a los espectadores durante los eventos. A pesar de sufrir daños por terremotos, saqueadores de piedra que reutilizaron sus materiales para otros edificios y el paso del tiempo, el Coliseo ha perdurado como un poderoso símbolo de la Roma Imperial y la civilización antigua. Hoy se erige como una de las atracciones turísticas más populares de Roma y Patrimonio de la Humanidad de la UNESCO, atrayendo millones de visitantes anualmente.',
        historicalInfo: 'El Coliseo, también conocido como Anfiteatro Flavio, es un anfiteatro ovalado en el centro de Roma. Construido con piedra caliza travertino, toba y hormigón revestido de ladrillos, fue el anfiteatro más grande jamás construido en su época y albergaba entre 50.000 y 80.000 espectadores.',
        yearBuilt: '70-80 d.C.',
        architect: 'Emperadores Vespasiano y Tito'
      },
      fr: {
        name: 'Colisée',
        narration: 'Bienvenue au Colisée, le symbole emblématique de Rome. Cet amphithéâtre antique accueillait des combats de gladiateurs et des spectacles publics.',
        description: 'Le plus grand amphithéâtre jamais construit, site du patrimoine mondial de l\'UNESCO',
        detailedDescription: 'Le Colisée, également connu sous le nom d\'Amphithéâtre Flavien, est l\'un des plus grands exploits architecturaux de la Rome antique. Construit entre 70-80 après J.-C. sous les empereurs Vespasien et Titus, cette structure pouvait accueillir 50 000 à 80 000 spectateurs. Le sol de l\'arène cachait un réseau souterrain appelé hypogée. Aujourd\'hui, il est l\'une des attractions les plus populaires de Rome et un site du patrimoine mondial de l\'UNESCO.',
        historicalInfo: 'Le Colisée, également connu sous le nom d\'Amphithéâtre Flavien, est un amphithéâtre ovale au centre de Rome. Construit en pierre calcaire travertin, tuf et béton revêtu de briques, c\'était le plus grand amphithéâtre jamais construit à l\'époque et pouvait accueillir de 50 000 à 80 000 spectateurs.',
        yearBuilt: '70-80 apr. J.-C.',
        architect: 'Empereurs Vespasien et Titus'
      },
      de: {
        name: 'Kolosseum',
        narration: 'Willkommen im Kolosseum, dem ikonischen Symbol Roms. Dieses antike Amphitheater war Schauplatz von Gladiatorenkämpfen und öffentlichen Spektakeln.',
        description: 'Das größte jemals gebaute Amphitheater, UNESCO-Weltkulturerbe',
        detailedDescription: 'Das Kolosseum, auch als Flavisches Amphitheater bekannt, gilt als eine der größten architektonischen Errungenschaften des antiken Roms und bleibt das größte jemals gebaute Amphitheater. Erbaut zwischen 70 und 80 n. Chr. unter den Kaisern Vespasian und Titus, konnte diese prächtige elliptische Struktur zwischen 50.000 und 80.000 Zuschauer aufnehmen, die kamen, um Gladiatorenkämpfe, Tierjagden, nachgestellte Seeschlachten und öffentliche Hinrichtungen zu sehen. Der Name "Kolosseum" leitet sich wahrscheinlich von der kolossalen Bronzestatue Neros ab, die einst in der Nähe stand. Hauptsächlich aus Travertin-Kalksteinblöcken, vulkanischem Tuffstein und ziegelverkleidetem Beton erbaut, zeigt das Kolosseum die ingenieurstechnische Brillanz der römischen Architektur. Sein innovatives Design zeichnete sich durch ein komplexes System aus Gewölben und Bögen aus, das das Gewicht effizient verteilte und die massive vierstöckige Fassade ermöglichte. Die Außenseite war mit dorischen, ionischen und korinthischen Säulen auf aufeinanderfolgenden Ebenen geschmückt, was die römische Beherrschung der klassischen Architekturordnungen demonstrierte. Der Arenaboden, einst mit Holzplanken und Sand bedeckt, verbarg ein aufwendiges unterirdisches Netzwerk namens Hypogeum - einen zweistöckigen unterirdischen Komplex aus Tunneln und Kammern, in denen Gladiatoren, Tiere und Bühnenausrüstung untergebracht und für die Spektakel oben vorbereitet wurden. Ein ausgeklügeltes System aus Flaschenzügen, Rampen und Falltüren ermöglichte dramatische Auftritte und Spezialeffekte während der Vorführungen. Das Kolosseum verfügte auch über ein einziehbares Sonnensegelsystem namens Velarium, das von Seeleuten der römischen Marine bedient wurde und den Zuschauern während der Veranstaltungen Schatten spendete. Trotz Schäden durch Erdbeben, Steinräuber, die seine Materialien für andere Gebäude wiederverwendeten, und den allgemeinen Lauf der Zeit, ist das Kolosseum als mächtiges Symbol des kaiserlichen Roms und der antiken Zivilisation erhalten geblieben. Heute steht es als eine der beliebtesten Touristenattraktionen Roms und UNESCO-Weltkulturerbe.',
        historicalInfo: 'Das Kolosseum, auch als Flavisches Amphitheater bekannt, ist ein ovales Amphitheater im Zentrum Roms. Aus Travertin-Kalkstein, Tuffstein und ziegelverkleideten Beton gebaut, war es das größte jemals gebaute Amphitheater seiner Zeit und fasste 50.000 bis 80.000 Zuschauer.',
        yearBuilt: '70-80 n. Chr.',
        architect: 'Kaiser Vespasian und Titus'
      },
      zh: {
        name: '罗马斗兽场',
        narration: '欢迎来到罗马斗兽场，罗马的标志性象征。这座古老的圆形剧场曾举办角斗士比赛和公共表演。',
        description: '有史以来最大的圆形剧场，联合国教科文组织世界遗产',
        detailedDescription: '罗马斗兽场，也称为弗拉维圆形剧场，是古罗马最伟大的建筑成就之一，至今仍是有史以来建造的最大圆形剧场。这座宏伟的椭圆形建筑建于公元70-80年，由韦斯巴芗皇帝和提图斯皇帝主持建造，可容纳5万至8万名观众，他们来此观看角斗士战斗、动物狩猎、模拟海战和公开处决。"斗兽场"这个名字可能源自曾经矗立在附近的尼禄巨型青铜雕像。斗兽场主要由石灰华石灰岩块、火山凝灰岩和砖面混凝土建造，展示了罗马建筑的工程才华。其创新设计采用了复杂的拱顶和拱门系统，有效分配重量，支撑起巨大的四层外立面。外部装饰有多立克式、爱奥尼亚式和科林斯式柱子，层层叠加，展现了罗马人对古典建筑柱式的精通。竞技场地面曾覆盖着木板和沙子，下面隐藏着一个精密的地下网络，称为地下层——一个两层的地下隧道和房间系统，用于存放角斗士、动物和舞台设备，并为上方的表演做准备。复杂的滑轮、斜坡和活板门系统使表演期间能够实现戏剧性的入场和特效。斗兽场还配备了一个可伸缩的遮阳系统，称为天幕，由罗马海军的水手操作，在活动期间为观众提供遮阳。尽管遭受了地震、掠夺其材料用于其他建筑的石材盗贼以及时间流逝的破坏，斗兽场仍作为罗马帝国和古代文明的强大象征而屹立不倒。如今，它是罗马最受欢迎的旅游景点之一，也是联合国教科文组织世界遗产，每年吸引数百万游客前来欣赏这座罗马工程和娱乐的非凡纪念碑。',
        historicalInfo: '罗马斗兽场，也称为弗拉维圆形剧场，是位于罗马市中心的椭圆形圆形剧场。它由石灰华石灰岩、凝灰岩和砖面混凝土建造，是当时建造的最大的圆形剧场，可容纳5万至8万名观众。',
        yearBuilt: '公元70-80年',
        architect: '韦斯巴芗皇帝和提图斯皇帝'
      },
      ja: {
        name: 'コロッセオ',
        narration: 'ローマの象徴的シンボル、コロッセオへようこそ。この古代円形闘技場では剣闘士の戦いや公開スペクタクルが開催されました。',
        description: '史上最大の円形闘技場、ユネスコ世界遺産',
        detailedDescription: 'フラウィウス円形闘技場としても知られるコロッセオは、古代ローマの最も偉大な建築的成果の一つであり、これまでに建設された最大の円形闘技場です。西暦70-80年にウェスパシアヌス帝とティトゥス帝の下で建設されたこの壮大な楕円形構造物は、剣闘士の戦い、動物狩り、模擬海戦、公開処刑を観覧するために訪れた5万から8万人の観客を収容できました。「コロッセオ」という名前は、かつて近くに立っていたネロの巨大な青銅像に由来すると考えられています。主にトラバーチン石灰岩ブロック、火山凝灰岩、レンガ張りコンクリートで建設されたコロッセオは、ローマ建築の工学的輝きを示しています。革新的な設計は、重量を効率的に分散する複雑なヴォールトとアーチのシステムを特徴とし、巨大な4階建てのファサードを可能にしました。外装は連続する階層にドーリア式、イオニア式、コリント式の柱で装飾され、ローマ人の古典建築様式の習熟を示しています。かつて木製の板と砂で覆われていた闘技場の床は、ハイポジウムと呼ばれる精巧な地下ネットワークを隠していました - 剣闘士、動物、舞台装置が収容され、上での光景のために準備された2層の地下トンネルと部屋の複合体でした。洗練された滑車、スロープ、落とし戸のシステムにより、パフォーマンス中の劇的な登場と特殊効果が可能になりました。コロッセオにはベラリウムと呼ばれる格納式日よけシステムも備えられており、ローマ海軍の船員によって操作され、イベント中に観客に日陰を提供しました。地震、他の建物のために材料を転用した石泥棒、そして時の経過による被害にもかかわらず、コロッセオは帝政ローマと古代文明の強力な象徴として耐えてきました。今日、ローマで最も人気のある観光名所の一つであり、ユネスコ世界遺産として立っており、毎年数百万人の訪問者がローマの工学と娯楽のこの驚異的な記念碑を賞賛するために訪れます。',
        historicalInfo: 'コロッセオは、フラウィウス円形闘技場とも呼ばれ、ローマ中心部にある楕円形の円形闘技場です。トラバーチン石灰岩、凝灰岩、レンガ張りコンクリートで建設され、当時建造された最大の円形闘技場で、5万から8万人の観客を収容しました。',
        yearBuilt: '西暦70-80年',
        architect: 'ウェスパシアヌス帝とティトゥス帝'
      },
      pt: {
        name: 'Coliseu',
        narration: 'Bem-vindo ao Coliseu, o símbolo icônico de Roma. Este antigo anfiteatro já abrigou combates de gladiadores e espetáculos públicos.',
        description: 'O maior anfiteatro já construído, Patrimônio Mundial da UNESCO',
        detailedDescription: 'O Coliseu, também conhecido como Anfiteatro Flaviano, destaca-se como uma das maiores realizações arquitetônicas da Roma Antiga e permanece como o maior anfiteatro já construído. Construído entre 70-80 d.C. sob os imperadores Vespasiano e Tito, esta magnífica estrutura elíptica podia acomodar entre 50.000 e 80.000 espectadores que vinham assistir a combates de gladiadores, caçadas de animais, batalhas navais simuladas e execuções públicas. O nome "Coliseu" provavelmente deriva da colossal estátua de bronze de Nero que outrora ficava nas proximidades. Construído principalmente com blocos de calcário travertino, tufo vulcânico e concreto revestido de tijolos, o Coliseu demonstra a genialidade da engenharia da arquitetura romana. Seu design inovador apresentava um complexo sistema de abóbadas e arcos que distribuíam o peso de forma eficiente, permitindo sua massiva fachada de quatro andares. O exterior era adornado com colunas dóricas, jônicas e coríntias em níveis sucessivos, demonstrando o domínio romano das ordens arquitetônicas clássicas. O piso da arena, outrora coberto com tábuas de madeira e areia, ocultava uma elaborada rede subterrânea chamada hipogeu - um complexo subterrâneo de dois níveis com túneis e câmaras onde gladiadores, animais e equipamentos cênicos eram alojados e preparados para os espetáculos acima. Um sofisticado sistema de polias, rampas e alçapões permitia entradas dramáticas e efeitos especiais durante as apresentações. O Coliseu também possuía um sistema de toldos retráteis chamado velarium, operado por marinheiros da marinha romana, que fornecia sombra aos espectadores durante os eventos. Apesar dos danos sofridos por terremotos, saqueadores de pedras que reutilizaram seus materiais para outros edifícios e a passagem do tempo, o Coliseu perdurou como um poderoso símbolo da Roma Imperial e da civilização antiga. Hoje, ergue-se como uma das atrações turísticas mais populares de Roma e Patrimônio Mundial da UNESCO, atraindo milhões de visitantes anualmente.',
        historicalInfo: 'O Coliseu, também conhecido como Anfiteatro Flaviano, é um anfiteatro oval no centro de Roma. Construído em calcário travertino, tufo e concreto revestido de tijolos, foi o maior anfiteatro já construído na época e comportava de 50.000 a 80.000 espectadores.',
        yearBuilt: '70-80 d.C.',
        architect: 'Imperadores Vespasiano e Tito'
      },
      ru: {
        name: 'Колизей',
        narration: 'Добро пожаловать в Колизей, знаковый символ Рима. Этот древний амфитеатр когда-то принимал гладиаторские бои и публичные зрелища.',
        description: 'Самый большой амфитеатр из когда-либо построенных, объект Всемирного наследия ЮНЕСКО',
        detailedDescription: 'Колизей, также известный как Амфитеатр Флавиев, является одним из величайших архитектурных достижений Древнего Рима и остается крупнейшим амфитеатром из когда-либо построенных. Возведенный между 70-80 гг. н.э. при императорах Веспасиане и Тите, это великолепное эллиптическое сооружение могло вместить от 50 000 до 80 000 зрителей, приходивших смотреть гладиаторские бои, охоту на животных, инсценированные морские сражения и публичные казни. Название «Колизей» вероятно происходит от колоссальной бронзовой статуи Нерона, некогда стоявшей поблизости. Построенный преимущественно из блоков травертинового известняка, вулканического туфа и облицованного кирпичом бетона, Колизей демонстрирует инженерный гений римской архитектуры. Его новаторский дизайн включал сложную систему сводов и арок, эффективно распределявших вес и позволивших создать массивный четырехэтажный фасад. Внешняя сторона была украшена дорическими, ионическими и коринфскими колоннами на последовательных уровнях, демонстрируя римское мастерство классических архитектурных ордеров. Пол арены, некогда покрытый деревянным настилом и песком, скрывал сложную подземную сеть под названием гипогей — двухуровневый подземный комплекс туннелей и камер, где размещались и готовились к выступлениям гладиаторы, животные и сценическое оборудование. Сложная система блоков, пандусов и люков позволяла создавать драматические появления и спецэффекты во время представлений. Колизей также имел раздвижную систему навесов под названием веларий, управляемую моряками римского флота, которая обеспечивала тень зрителям во время мероприятий. Несмотря на повреждения от землетрясений, разграбление камней для других зданий и общий ход времени, Колизей сохранился как мощный символ Императорского Рима и древней цивилизации. Сегодня он является одной из самых популярных туристических достопримечательностей Рима и объектом Всемирного наследия ЮНЕСКО, привлекая миллионы посетителей ежегодно.',
        historicalInfo: 'Колизей, также известный как амфитеатр Флавиев, представляет собой овальный амфитеатр в центре Рима. Построенный из травертинового известняка, туфа и облицованного кирпичом бетона, он был самым большим амфитеатром, когда-либо построенным в то время, и вмещал от 50 000 до 80 000 зрителей.',
        yearBuilt: '70-80 гг. н.э.',
        architect: 'Императоры Веспасиан и Тит'
      }
    }
  },
  {
    id: 'roman_forum',
    cityId: 'rome',
    name: 'Roman Forum',
    lat: 41.892464,
    lng: 12.485325,
    radius: 60,
    narration: 'You are at the Roman Forum, the heart of ancient Rome. This was the center of political life during the Republic era, where historic buildings still stand.',
    description: 'The center of ancient Roman public life',
    category: 'Ancient Rome',
    detailedDescription: 'The Roman Forum, known as Forum Romanum in Latin, represents the beating heart of ancient Rome and stands as one of the most important archaeological sites in the world. For over a thousand years, this rectangular plaza served as the center of Roman public life, witnessing the rise and fall of the Roman Republic and Empire. Originally a marshy burial ground between the Palatine and Capitoline Hills, the area was drained in the 7th century BC and transformed into Rome\'s central marketplace and gathering place. As Rome grew in power and prestige, the Forum evolved from a simple marketplace into a magnificent complex of temples, basilicas, and government buildings that showcased the architectural and political achievements of Roman civilization. The Forum was the site of triumphal processions celebrating military victories, where victorious generals would parade through the Via Sacra (Sacred Road) with their spoils of war and captive enemies. It hosted political assemblies where citizens debated the future of the Republic, criminal trials that determined justice, public speeches that swayed public opinion, and commercial activities that drove the Roman economy. Among its most significant structures was the Curia Julia, the senate house where Rome\'s most powerful political body met to debate legislation and policy. The Temple of Saturn, one of the Forum\'s oldest and most revered buildings, housed the state treasury and was the site of the annual Saturnalia festival. The Arch of Septimius Severus commemorated military victories in the East, while the Column of Phocas, erected in 608 AD, represents one of the last monuments added to the Forum. The Basilica Julia and Basilica Aemilia served as courts of law and commercial centers, their vast interiors bustling with lawyers, merchants, and citizens conducting business. The Temple of Vesta, home to the sacred flame tended by the Vestal Virgins, symbolized the eternal nature of Rome itself. After the fall of the Western Roman Empire, the Forum gradually fell into disrepair, its monuments stripped for building materials and its ground level rising as centuries of debris accumulated. During the Middle Ages, the area was known as "Campo Vaccino" (Cow Field) and was used for grazing cattle. Systematic excavations beginning in the 18th and 19th centuries revealed the Forum\'s magnificent past, uncovering temples, arches, and basilicas that had been buried for centuries. Today, walking through the Roman Forum is like stepping back in time, where every column, arch, and stone tells a story of ancient Rome\'s glory, power, and eventual decline.',
    photos: [
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800'
    ],
    historicalInfo: 'The Roman Forum was the center of day-to-day life in Rome: the site of triumphal processions and elections, the venue for public speeches, criminal trials, and gladiatorial matches, and the nucleus of commercial affairs.',
    yearBuilt: '7th century BC',
    architect: 'Various Roman architects over centuries',
    translations: {
      en: {
        name: 'Roman Forum',
        narration: 'You are at the Roman Forum, the heart of ancient Rome. This was the center of political life during the Republic era, where historic buildings still stand.',
        description: 'The center of ancient Roman public life',
        detailedDescription: 'The Roman Forum, known as Forum Romanum in Latin, represents the beating heart of ancient Rome and stands as one of the most important archaeological sites in the world. For over a thousand years, this rectangular plaza served as the center of Roman public life, witnessing the rise and fall of the Roman Republic and Empire. Originally a marshy burial ground between the Palatine and Capitoline Hills, the area was drained in the 7th century BC and transformed into Rome\'s central marketplace and gathering place. As Rome grew in power and prestige, the Forum evolved from a simple marketplace into a magnificent complex of temples, basilicas, and government buildings that showcased the architectural and political achievements of Roman civilization. The Forum was the site of triumphal processions celebrating military victories, where victorious generals would parade through the Via Sacra (Sacred Road) with their spoils of war and captive enemies. It hosted political assemblies where citizens debated the future of the Republic, criminal trials that determined justice, public speeches that swayed public opinion, and commercial activities that drove the Roman economy. Among its most significant structures was the Curia Julia, the senate house where Rome\'s most powerful political body met to debate legislation and policy. The Temple of Saturn, one of the Forum\'s oldest and most revered buildings, housed the state treasury and was the site of the annual Saturnalia festival. The Arch of Septimius Severus commemorated military victories in the East, while the Column of Phocas, erected in 608 AD, represents one of the last monuments added to the Forum. The Basilica Julia and Basilica Aemilia served as courts of law and commercial centers, their vast interiors bustling with lawyers, merchants, and citizens conducting business. The Temple of Vesta, home to the sacred flame tended by the Vestal Virgins, symbolized the eternal nature of Rome itself. After the fall of the Western Roman Empire, the Forum gradually fell into disrepair, its monuments stripped for building materials and its ground level rising as centuries of debris accumulated. During the Middle Ages, the area was known as "Campo Vaccino" (Cow Field) and was used for grazing cattle. Systematic excavations beginning in the 18th and 19th centuries revealed the Forum\'s magnificent past, uncovering temples, arches, and basilicas that had been buried for centuries. Today, walking through the Roman Forum is like stepping back in time, where every column, arch, and stone tells a story of ancient Rome\'s glory, power, and eventual decline.',
        historicalInfo: 'The Roman Forum was the center of day-to-day life in Rome: the site of triumphal processions and elections, the venue for public speeches, criminal trials, and gladiatorial matches, and the nucleus of commercial affairs.',
        yearBuilt: '7th century BC',
        architect: 'Various Roman architects over centuries'
      },
      it: {
        name: 'Foro Romano',
        narration: 'Ti trovi al Foro Romano, il cuore dell\'antica Roma. Questo era il centro della vita politica durante l\'era della Repubblica, dove gli edifici storici sono ancora in piedi.',
        description: 'Il centro della vita pubblica dell\'antica Roma',
        historicalInfo: 'Il Foro Romano era il centro della vita quotidiana a Roma: sede di processioni trionfali ed elezioni, luogo di discorsi pubblici, processi penali e combattimenti tra gladiatori, e nucleo del commercio.',
        yearBuilt: 'VII secolo a.C.',
        architect: 'Vari architetti romani nel corso dei secoli'
      },
      ko: {
        name: '로마 포럼',
        narration: '고대 로마의 심장부인 로마 포럼에 오셨습니다. 이곳은 공화정 시대 정치 생활의 중심지였으며, 역사적인 건물들이 여전히 서 있습니다.',
        description: '고대 로마 공공 생활의 중심지',
        detailedDescription: '라틴어로 포룸 로마눔(Forum Romanum)으로 알려진 로마 포럼은 고대 로마의 심장부를 대표하며 세계에서 가장 중요한 고고학 유적지 중 하나입니다. 천 년 이상 동안 이 직사각형 광장은 로마 공공 생활의 중심지 역할을 하며 로마 공화정과 제국의 흥망성쇠를 목격했습니다. 원래 팔라티노 언덕과 카피톨리노 언덕 사이의 늪지대 묘지였던 이 지역은 기원전 7세기에 배수되어 로마의 중앙 시장과 집회 장소로 변모했습니다. 로마가 권력과 명성을 얻으면서 포럼은 단순한 시장에서 로마 문명의 건축적, 정치적 성취를 보여주는 신전, 바실리카, 정부 건물의 웅장한 복합 단지로 발전했습니다. 포럼은 군사 승리를 축하하는 개선 행렬의 장소였으며, 승리한 장군들이 전리품과 포로들을 이끌고 비아 사크라(성스러운 길)를 행진했습니다. 시민들이 공화정의 미래를 논의하는 정치 집회, 정의를 결정하는 형사 재판, 여론을 좌우하는 공개 연설, 로마 경제를 이끈 상업 활동이 이곳에서 열렸습니다. 가장 중요한 건축물 중에는 로마의 가장 강력한 정치 기구가 입법과 정책을 논의하기 위해 모인 원로원 건물인 쿠리아 율리아가 있었습니다. 포럼에서 가장 오래되고 존경받는 건물 중 하나인 사투르누스 신전은 국고를 보관했으며 연례 사투르날리아 축제의 장소였습니다. 셉티미우스 세베루스 개선문은 동방에서의 군사 승리를 기념했으며, 서기 608년에 세워진 포카스 기둥은 포럼에 추가된 마지막 기념물 중 하나를 나타냅니다. 율리아 바실리카와 아이밀리아 바실리카는 법정과 상업 중심지로 사용되었으며, 변호사, 상인, 시민들로 붐비는 광대한 내부 공간을 자랑했습니다. 베스타 신전은 베스타 처녀들이 관리하는 신성한 불꽃의 집으로 로마 자체의 영원한 본질을 상징했습니다. 서로마 제국의 몰락 후 포럼은 점차 황폐해졌으며, 기념물들은 건축 자재로 약탈당했고 수세기에 걸친 잔해가 쌓이면서 지면이 상승했습니다. 중세 시대에 이 지역은 "캄포 바치노"(소 밭)로 알려졌으며 소를 방목하는 데 사용되었습니다. 18세기와 19세기에 시작된 체계적인 발굴은 포럼의 웅장한 과거를 드러냈으며, 수세기 동안 묻혀 있던 신전, 아치, 바실리카를 발견했습니다. 오늘날 로마 포럼을 걷는 것은 시간을 거슬러 올라가는 것과 같으며, 모든 기둥, 아치, 돌이 고대 로마의 영광, 권력, 그리고 결국의 쇠퇴에 대한 이야기를 전합니다.',
        historicalInfo: '로마 포럼은 로마의 일상생활의 중심지였습니다: 개선 행렬과 선거가 열렸고, 공개 연설, 형사 재판, 검투사 경기가 열렸으며, 상업 활동의 핵심이었습니다.',
        yearBuilt: '기원전 7세기',
        architect: '여러 세기에 걸친 다양한 로마 건축가들'
      },
      es: {
        name: 'Foro Romano',
        narration: 'Está en el Foro Romano, el corazón de la antigua Roma. Este fue el centro de la vida política durante la era de la República, donde aún se mantienen edificios históricos.',
        description: 'El centro de la vida pública de la antigua Roma',
        detailedDescription: 'El Foro Romano, conocido en latín como Forum Romanum, representa el corazón palpitante de la antigua Roma y se erige como uno de los sitios arqueológicos más importantes del mundo. Durante más de mil años, esta plaza rectangular sirvió como centro de la vida pública romana, siendo testigo del auge y caída de la República y el Imperio Romano. Originalmente un cementerio pantanoso entre las colinas Palatina y Capitolina, el área fue drenada en el siglo VII a.C. y transformada en el mercado central y lugar de reunión de Roma. A medida que Roma crecía en poder y prestigio, el Foro evolucionó de un simple mercado a un magnífico complejo de templos, basílicas y edificios gubernamentales que exhibían los logros arquitectónicos y políticos de la civilización romana. El Foro fue el escenario de procesiones triunfales celebrando victorias militares, donde los generales victoriosos desfilaban por la Vía Sacra con sus botines de guerra y enemigos cautivos. Albergó asambleas políticas donde los ciudadanos debatían el futuro de la República, juicios penales que determinaban la justicia, discursos públicos que influían en la opinión pública y actividades comerciales que impulsaban la economía romana. Entre sus estructuras más significativas se encontraba la Curia Julia, la sede del senado donde el cuerpo político más poderoso de Roma se reunía para debatir legislación y política. El Templo de Saturno, uno de los edificios más antiguos y venerados del Foro, albergaba el tesoro estatal y era el lugar del festival anual de Saturnalia. El Arco de Septimio Severo conmemoraba las victorias militares en Oriente, mientras que la Columna de Focas, erigida en el 608 d.C., representa uno de los últimos monumentos añadidos al Foro. Hoy, caminar por el Foro Romano es como retroceder en el tiempo, donde cada columna, arco y piedra cuenta una historia de la gloria, el poder y el eventual declive de la antigua Roma.',
        historicalInfo: 'El Foro Romano fue el centro de la vida cotidiana en Roma: el lugar de procesiones triunfales y elecciones, el escenario de discursos públicos, juicios penales y combates de gladiadores, y el núcleo de los asuntos comerciales.',
        yearBuilt: 'Siglo VII a.C.',
        architect: 'Varios arquitectos romanos a lo largo de los siglos'
      },
      fr: {
        name: 'Forum Romain',
        narration: 'Vous êtes au Forum Romain, le cœur de la Rome antique. C\'était le centre de la vie politique pendant l\'ère de la République, où se dressent encore des bâtiments historiques.',
        description: 'Le centre de la vie publique de la Rome antique',
        detailedDescription: 'Le Forum Romain, connu en latin sous le nom de Forum Romanum, représente le cœur battant de la Rome antique et constitue l\'un des sites archéologiques les plus importants au monde. Pendant plus de mille ans, cette place rectangulaire a servi de centre de la vie publique romaine, témoin de l\'ascension et de la chute de la République et de l\'Empire romains. À l\'origine un cimetière marécageux entre les collines du Palatin et du Capitole, la zone a été drainée au VIIe siècle avant J.-C. et transformée en marché central et lieu de rassemblement de Rome. À mesure que Rome gagnait en pouvoir et en prestige, le Forum a évolué d\'un simple marché en un magnifique complexe de temples, de basiliques et de bâtiments gouvernementaux qui mettaient en valeur les réalisations architecturales et politiques de la civilisation romaine. Le Forum était le théâtre des processions triomphales célébrant les victoires militaires, où les généraux victorieux défilaient sur la Via Sacra avec leurs butins de guerre et leurs ennemis captifs. Il accueillait des assemblées politiques où les citoyens débattaient de l\'avenir de la République, des procès criminels qui rendaient la justice, des discours publics qui influençaient l\'opinion publique et des activités commerciales qui stimulaient l\'économie romaine. Parmi ses structures les plus importantes figurait la Curie Julia, le siège du sénat où le corps politique le plus puissant de Rome se réunissait pour débattre des lois et des politiques. Le Temple de Saturne, l\'un des bâtiments les plus anciens et les plus vénérés du Forum, abritait le trésor public et était le lieu du festival annuel des Saturnales. L\'Arc de Septime Sévère commémorait les victoires militaires en Orient, tandis que la Colonne de Phocas, érigée en 608 après J.-C., représente l\'un des derniers monuments ajoutés au Forum. Aujourd\'hui, marcher dans le Forum Romain, c\'est comme remonter le temps, où chaque colonne, arc et pierre raconte une histoire de la gloire, de la puissance et du déclin éventuel de la Rome antique.',
        historicalInfo: 'Le Forum Romain était le centre de la vie quotidienne à Rome : lieu de processions triomphales et d\'élections, cadre de discours publics, de procès criminels et de combats de gladiateurs, et noyau des affaires commerciales.',
        yearBuilt: 'VIIe siècle av. J.-C.',
        architect: 'Divers architectes romains au fil des siècles'
      },
      de: {
        name: 'Forum Romanum',
        narration: 'Sie befinden sich am Forum Romanum, dem Herzen des antiken Roms. Dies war das Zentrum des politischen Lebens während der Republik, wo historische Gebäude noch stehen.',
        description: 'Das Zentrum des öffentlichen Lebens im antiken Rom',
        detailedDescription: 'Das Forum Romanum, im Lateinischen als Forum Romanum bekannt, repräsentiert das schlagende Herz des antiken Roms und gilt als eine der bedeutendsten archäologischen Stätten der Welt. Über tausend Jahre lang diente dieser rechteckige Platz als Zentrum des römischen öffentlichen Lebens und war Zeuge des Aufstiegs und Falls der Römischen Republik und des Römischen Reiches. Ursprünglich ein sumpfiger Friedhof zwischen dem Palatin und dem Kapitolshügel, wurde das Gebiet im 7. Jahrhundert v. Chr. trockengelegt und in Roms zentralen Marktplatz und Versammlungsort verwandelt. Mit wachsender Macht und Prestige Roms entwickelte sich das Forum von einem einfachen Marktplatz zu einem prächtigen Komplex aus Tempeln, Basiliken und Regierungsgebäuden, die die architektonischen und politischen Errungenschaften der römischen Zivilisation zur Schau stellten. Das Forum war Schauplatz von Triumphzügen zur Feier militärischer Siege, bei denen siegreiche Generäle mit ihrer Kriegsbeute und gefangenen Feinden über die Via Sacra paradierten. Es beherbergte politische Versammlungen, bei denen Bürger über die Zukunft der Republik debattierten, Strafprozesse, die über Gerechtigkeit entschieden, öffentliche Reden, die die öffentliche Meinung beeinflussten, und kommerzielle Aktivitäten, die die römische Wirtschaft antrieben. Zu den bedeutendsten Bauwerken gehörte die Curia Julia, das Senatsgebäude, in dem Roms mächtigstes politisches Gremium zusammenkam, um über Gesetzgebung und Politik zu debattieren. Der Saturntempel, eines der ältesten und am meisten verehrten Gebäude des Forums, beherbergte die Staatskasse und war Austragungsort des jährlichen Saturnalienfestes. Der Septimius-Severus-Bogen erinnerte an militärische Siege im Osten, während die Phokas-Säule, die 608 n. Chr. errichtet wurde, eines der letzten dem Forum hinzugefügten Monumente darstellt. Heute ist ein Spaziergang durch das Forum Romanum wie eine Zeitreise, bei der jede Säule, jeder Bogen und jeder Stein eine Geschichte von der Herrlichkeit, Macht und dem schließlichen Niedergang des antiken Roms erzählt.',
        historicalInfo: 'Das Forum Romanum war das Zentrum des täglichen Lebens in Rom: Schauplatz von Triumphzügen und Wahlen, Austragungsort öffentlicher Reden, Gerichtsverhandlungen und Gladiatorenkämpfe sowie Mittelpunkt des Handels.',
        yearBuilt: '7. Jahrhundert v. Chr.',
        architect: 'Verschiedene römische Architekten über Jahrhunderte'
      },
      zh: {
        name: '古罗马广场',
        narration: '您在古罗马广场，古罗马的心脏。这里是共和国时代政治生活的中心，历史建筑仍然屹立。',
        description: '古罗马公共生活的中心',
        detailedDescription: '古罗马广场，拉丁语称为Forum Romanum，代表着古罗马的跳动心脏，是世界上最重要的考古遗址之一。一千多年来，这个长方形广场一直是罗马公共生活的中心，见证了罗马共和国和帝国的兴衰。这片区域最初是帕拉蒂尼山和卡比托利欧山之间的沼泽墓地，在公元前7世纪被排干并改造为罗马的中央市场和集会场所。随着罗马权力和威望的增长，广场从一个简单的市场演变为宏伟的神庙、巴西利卡和政府建筑群，展示了罗马文明的建筑和政治成就。广场是庆祝军事胜利的凯旋游行场所，胜利的将军们带着战利品和俘虏沿着圣道(Via Sacra)游行。这里举行公民辩论共和国未来的政治集会、裁定正义的刑事审判、影响民意的公开演讲，以及推动罗马经济的商业活动。最重要的建筑包括库里亚·朱利亚，即元老院大厦，罗马最强大的政治机构在此会面讨论立法和政策。土星神庙是广场上最古老、最受尊敬的建筑之一，存放着国库，也是每年农神节的举办地。塞普蒂米乌斯·塞维鲁凯旋门纪念东方的军事胜利，而建于公元608年的福卡斯柱代表了添加到广场的最后一批纪念碑之一。朱利亚巴西利卡和埃米利亚巴西利卡作为法庭和商业中心，宽敞的内部空间挤满了律师、商人和办理业务的市民。维斯塔神庙是贞女守护的圣火之家，象征着罗马本身的永恒本质。西罗马帝国灭亡后，广场逐渐荒废，纪念碑被拆除作为建筑材料，数世纪的碎片堆积使地面水平上升。中世纪时期，这片区域被称为"坎波瓦奇诺"(牛场)，用于放牧牛群。始于18和19世纪的系统发掘揭示了广场的辉煌过去，发现了埋藏数世纪的神庙、拱门和巴西利卡。今天，漫步古罗马广场就像穿越时光，每一根柱子、每一座拱门、每一块石头都在讲述古罗马的荣耀、权力以及最终衰落的故事。',
        historicalInfo: '古罗马广场是罗马日常生活的中心：凯旋游行和选举的场所，公开演讲、刑事审判和角斗比赛的场地，以及商业事务的核心。',
        yearBuilt: '公元前7世纪',
        architect: '历代众多罗马建筑师'
      },
      ja: {
        name: 'フォロ・ロマーノ',
        narration: '古代ローマの中心、フォロ・ロマーノにいます。ここは共和政時代の政治生活の中心地で、歴史的建造物が今も立っています。',
        description: '古代ローマの公共生活の中心',
        detailedDescription: 'ラテン語でフォルム・ロマヌム(Forum Romanum)として知られるフォロ・ロマーノは、古代ローマの鼓動する心臓部を表し、世界で最も重要な考古学的遺跡の一つです。千年以上にわたり、この長方形の広場はローマの公共生活の中心として機能し、ローマ共和政と帝国の興亡を目撃しました。元々はパラティーノの丘とカピトリーノの丘の間の湿地帯の墓地でしたが、紀元前7世紀に排水され、ローマの中央市場と集会場に変貌しました。ローマが権力と威信を増すにつれ、フォロは単純な市場から、ローマ文明の建築的・政治的業績を示す神殿、バシリカ、政府建物の壮大な複合施設へと進化しました。フォロは軍事的勝利を祝う凱旋行進の場所であり、勝利した将軍たちが戦利品と捕虜を引き連れてヴィア・サクラ(聖なる道)を行進しました。共和政の未来を議論する市民の政治集会、正義を決定する刑事裁判、世論を動かす公開演説、ローマ経済を推進する商業活動が開催されました。最も重要な建造物の中には、ローマの最も強力な政治組織が立法と政策を議論するために集まった元老院議事堂であるクリア・ユリアがありました。フォロ最古で最も崇敬される建物の一つであるサトゥルヌス神殿は国庫を収容し、年次サトゥルナリア祭の会場でした。セプティミウス・セウェルスの凱旋門は東方での軍事的勝利を記念し、紀元608年に建てられたフォカスの柱はフォロに追加された最後の記念碑の一つを表しています。バシリカ・ユリアとバシリカ・アエミリアは法廷と商業センターとして機能し、その広大な内部は弁護士、商人、業務を行う市民で賑わっていました。ウェスタ神殿はウェスタの処女たちが守る聖なる炎の家であり、ローマ自体の永遠の本質を象徴していました。西ローマ帝国の崩壊後、フォロは徐々に荒廃し、記念碑は建築材料として剥ぎ取られ、何世紀もの瓦礫が蓄積して地面レベルが上昇しました。中世には、この地域は「カンポ・ヴァッキーノ」(牛の野原)として知られ、牛の放牧に使用されていました。18世紀と19世紀に始まった体系的な発掘により、フォロの壮大な過去が明らかになり、何世紀も埋もれていた神殿、アーチ、バシリカが発見されました。今日、フォロ・ロマーノを歩くことは時間を遡るようなもので、すべての柱、アーチ、石が古代ローマの栄光、権力、そして最終的な衰退の物語を語っています。',
        historicalInfo: 'フォロ・ロマーノはローマの日常生活の中心でした：凱旋行進や選挙の場所、公開演説、刑事裁判、剣闘士試合の会場、そして商業活動の中核でした。',
        yearBuilt: '紀元前7世紀',
        architect: '数世紀にわたる様々なローマの建築家たち'
      },
      pt: {
        name: 'Fórum Romano',
        narration: 'Você está no Fórum Romano, o coração da Roma antiga. Este foi o centro da vida política durante a era da República, onde edifícios históricos ainda permanecem.',
        description: 'O centro da vida pública da Roma antiga',
        detailedDescription: 'O Fórum Romano, conhecido em latim como Forum Romanum, representa o coração pulsante da Roma Antiga e destaca-se como um dos sítios arqueológicos mais importantes do mundo. Por mais de mil anos, esta praça retangular serviu como centro da vida pública romana, testemunhando a ascensão e queda da República e do Império Romano. Originalmente um cemitério pantanoso entre as colinas Palatino e Capitolino, a área foi drenada no século VII a.C. e transformada no mercado central e local de reunião de Roma. À medida que Roma crescia em poder e prestígio, o Fórum evoluiu de um simples mercado para um magnífico complexo de templos, basílicas e edifícios governamentais que exibiam as conquistas arquitetônicas e políticas da civilização romana. O Fórum foi o cenário de procissões triunfais celebrando vitórias militares, onde generais vitoriosos desfilavam pela Via Sacra com seus espólios de guerra e inimigos cativos. Abrigou assembleias políticas onde cidadãos debatiam o futuro da República, julgamentos criminais que determinavam a justiça, discursos públicos que influenciavam a opinião pública e atividades comerciais que impulsionavam a economia romana. Entre suas estruturas mais significativas estava a Cúria Júlia, a sede do senado onde o corpo político mais poderoso de Roma se reunia para debater legislação e política. O Templo de Saturno, um dos edifícios mais antigos e venerados do Fórum, abrigava o tesouro estatal e era o local do festival anual de Saturnália. O Arco de Sétimo Severo comemorava vitórias militares no Oriente, enquanto a Coluna de Focas, erguida em 608 d.C., representa um dos últimos monumentos adicionados ao Fórum. Hoje, caminhar pelo Fórum Romano é como voltar no tempo, onde cada coluna, arco e pedra conta uma história da glória, poder e eventual declínio da Roma Antiga.',
        historicalInfo: 'O Fórum Romano foi o centro da vida cotidiana em Roma: local de procissões triunfais e eleições, palco de discursos públicos, julgamentos criminais e combates de gladiadores, e núcleo dos assuntos comerciais.',
        yearBuilt: 'Século VII a.C.',
        architect: 'Vários arquitetos romanos ao longo dos séculos'
      },
      ru: {
        name: 'Римский форум',
        narration: 'Вы находитесь на Римском форуме, в сердце древнего Рима. Это был центр политической жизни в эпоху Республики, где до сих пор стоят исторические здания.',
        description: 'Центр общественной жизни древнего Рима',
        detailedDescription: 'Римский Форум был сердцем древнего Рима на протяжении более тысячи лет. Расположенный между холмами Палатин и Капитолий, этот прямоугольный форум являлся центром религиозной, политической, юридической и экономической жизни республики. Первоначально болотистая местность, которая осушалась и развивалась, начиная с 7 века до н.э., Форум постепенно заполнялся все более величественными храмами, базиликами и памятниками. Здесь римляне собирались для выборов, слушали речи политиков, присутствовали на уголовных процессах и участвовали в религиозных церемониях. Сегодня посетители могут исследовать остатки Храма Сатурна, Храма Весталок, Дом Весталок и Арку Тита.',
        historicalInfo: 'Римский форум был центром повседневной жизни в Риме: местом триумфальных шествий и выборов, площадкой для публичных выступлений, уголовных судов и гладиаторских боев, а также ядром коммерческой деятельности.',
        yearBuilt: 'VII век до н.э.',
        architect: 'Различные римские архитекторы на протяжении веков'
      }
    }
  },
  {
    id: 'trevi_fountain',
    cityId: 'rome',
    name: 'Trevi Fountain',
    lat: 41.900932,
    lng: 12.483313,
    radius: 50,
    narration: 'This is the Trevi Fountain. Legend says if you throw a coin over your shoulder into the fountain, you will return to Rome.',
    description: 'The most famous fountain in Rome',
    category: 'Fountain',
    detailedDescription: 'The Trevi Fountain, or Fontana di Trevi, stands as Rome\'s largest and most spectacular Baroque fountain, captivating millions of visitors each year with its grandeur, beauty, and legendary traditions. Measuring an impressive 26.3 meters (86 feet) high and 49.15 meters (161 feet) wide, this monumental masterpiece dominates the small Trevi square, creating a breathtaking spectacle of water, marble, and sculptural artistry. The fountain\'s history begins in ancient Rome, where it marked the terminal point of the Aqua Virgo aqueduct, one of the oldest water sources supplying the city. Legend tells of a young virgin who led thirsty Roman soldiers to this water source in 19 BC, giving the aqueduct its name. For centuries, a simple basin collected the aqueduct\'s waters until Pope Urban VIII commissioned Gian Lorenzo Bernini to create a more dramatic fountain in 1629. However, the project was abandoned when the Pope died, and it wasn\'t until 1732 that Pope Clement XII launched a competition to design a grand fountain worthy of the location. Nicola Salvi won the commission, and construction began in 1732, though Salvi would not live to see his masterpiece completed. The fountain was finally finished in 1762 by Giuseppe Pannini, thirty years after construction began. The fountain\'s design centers on a majestic depiction of Oceanus, the Titan god of the sea, riding a shell-shaped chariot pulled by two sea horses - one wild and one docile - representing the varying moods of the ocean. These magnificent creatures are guided by tritons, mythological sea gods depicted blowing conch shells. The central niche housing Oceanus is flanked by two allegorical figures: Abundance on the left, holding a horn of plenty, and Health on the right, holding a cup being drunk by a snake, symbolizing well-being and prosperity. Above these niches, relief sculptures depict the discovery of the spring by the virgin and Agrippa approving the aqueduct\'s construction. The fountain\'s elaborate facade rises from the Palazzo Poli behind it, creating a theatrical backdrop of Corinthian columns, ornate carvings, and flowing drapery sculpted in travertine stone. Water cascades dramatically over artificial rocks into the large basin below, creating a symphony of sound that echoes through the surrounding buildings. The fountain pumps approximately 2,824,800 cubic feet of water through its system daily, a testament to the ancient Roman engineering that still supplies it from the Aqua Virgo aqueduct. Perhaps the most famous tradition associated with the Trevi Fountain is the coin-tossing ritual. Legend holds that visitors who throw a coin over their left shoulder using their right hand will ensure their return to Rome. Throwing two coins will bring romance with a Roman, while three coins promise marriage. This tradition generates an estimated 3,000 euros worth of coins daily, all of which are collected and donated to charity, supporting various social programs in Rome. The fountain has captured imaginations worldwide through its appearances in cinema, most notably in Federico Fellini\'s "La Dolce Vita" (1960), where Anita Ekberg\'s iconic wade through its waters created one of film history\'s most memorable scenes. This moment cemented the fountain\'s status as a symbol of romance and Italian glamour. Throughout its history, the fountain has undergone several restorations to preserve its beauty and structural integrity. The most recent comprehensive restoration, funded by the Italian fashion house Fendi and completed in 2015, cleaned and repaired the monument, restoring its brilliant white travertine to its original splendor. Today, the Trevi Fountain remains one of Rome\'s most beloved landmarks and the world\'s most visited fountain. Visitors are no longer permitted to wade in its waters, as fines were instituted to protect the monument, but this has not diminished its appeal. The fountain continues to enchant with its baroque magnificence, the perpetual sound of flowing water, and the timeless hope embodied in each coin tossed into its sparkling basin.',
    photos: [
      'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800'
    ],
    historicalInfo: 'The Trevi Fountain is the largest Baroque fountain in the city and one of the most famous fountains in the world. Standing 26.3 metres (86 ft) high and 49.15 metres (161.3 ft) wide, it is the largest Baroque fountain in the city.',
    yearBuilt: '1732-1762',
    architect: 'Nicola Salvi',
    translations: {
      en: {
        name: 'Trevi Fountain',
        narration: 'This is the Trevi Fountain. Legend says if you throw a coin over your shoulder into the fountain, you will return to Rome.',
        description: 'The most famous fountain in Rome',
        detailedDescription: 'The Trevi Fountain, or Fontana di Trevi, stands as Rome\'s largest and most spectacular Baroque fountain, captivating millions of visitors each year with its grandeur, beauty, and legendary traditions. Measuring an impressive 26.3 meters (86 feet) high and 49.15 meters (161 feet) wide, this monumental masterpiece dominates the small Trevi square, creating a breathtaking spectacle of water, marble, and sculptural artistry. The fountain\'s history begins in ancient Rome, where it marked the terminal point of the Aqua Virgo aqueduct, one of the oldest water sources supplying the city. Legend tells of a young virgin who led thirsty Roman soldiers to this water source in 19 BC, giving the aqueduct its name. For centuries, a simple basin collected the aqueduct\'s waters until Pope Urban VIII commissioned Gian Lorenzo Bernini to create a more dramatic fountain in 1629. However, the project was abandoned when the Pope died, and it wasn\'t until 1732 that Pope Clement XII launched a competition to design a grand fountain worthy of the location. Nicola Salvi won the commission, and construction began in 1732, though Salvi would not live to see his masterpiece completed. The fountain was finally finished in 1762 by Giuseppe Pannini, thirty years after construction began. The fountain\'s design centers on a majestic depiction of Oceanus, the Titan god of the sea, riding a shell-shaped chariot pulled by two sea horses - one wild and one docile - representing the varying moods of the ocean. These magnificent creatures are guided by tritons, mythological sea gods depicted blowing conch shells. The central niche housing Oceanus is flanked by two allegorical figures: Abundance on the left, holding a horn of plenty, and Health on the right, holding a cup being drunk by a snake, symbolizing well-being and prosperity. Above these niches, relief sculptures depict the discovery of the spring by the virgin and Agrippa approving the aqueduct\'s construction. The fountain\'s elaborate facade rises from the Palazzo Poli behind it, creating a theatrical backdrop of Corinthian columns, ornate carvings, and flowing drapery sculpted in travertine stone. Water cascades dramatically over artificial rocks into the large basin below, creating a symphony of sound that echoes through the surrounding buildings. The fountain pumps approximately 2,824,800 cubic feet of water through its system daily, a testament to the ancient Roman engineering that still supplies it from the Aqua Virgo aqueduct. Perhaps the most famous tradition associated with the Trevi Fountain is the coin-tossing ritual. Legend holds that visitors who throw a coin over their left shoulder using their right hand will ensure their return to Rome. Throwing two coins will bring romance with a Roman, while three coins promise marriage. This tradition generates an estimated 3,000 euros worth of coins daily, all of which are collected and donated to charity, supporting various social programs in Rome. The fountain has captured imaginations worldwide through its appearances in cinema, most notably in Federico Fellini\'s "La Dolce Vita" (1960), where Anita Ekberg\'s iconic wade through its waters created one of film history\'s most memorable scenes. This moment cemented the fountain\'s status as a symbol of romance and Italian glamour. Throughout its history, the fountain has undergone several restorations to preserve its beauty and structural integrity. The most recent comprehensive restoration, funded by the Italian fashion house Fendi and completed in 2015, cleaned and repaired the monument, restoring its brilliant white travertine to its original splendor. Today, the Trevi Fountain remains one of Rome\'s most beloved landmarks and the world\'s most visited fountain. Visitors are no longer permitted to wade in its waters, as fines were instituted to protect the monument, but this has not diminished its appeal. The fountain continues to enchant with its baroque magnificence, the perpetual sound of flowing water, and the timeless hope embodied in each coin tossed into its sparkling basin.',
        historicalInfo: 'The Trevi Fountain is the largest Baroque fountain in the city and one of the most famous fountains in the world. Standing 26.3 metres (86 ft) high and 49.15 metres (161.3 ft) wide, it is the largest Baroque fountain in the city.',
        yearBuilt: '1732-1762',
        architect: 'Nicola Salvi'
      },
      it: {
        name: 'Fontana di Trevi',
        narration: 'Questa è la Fontana di Trevi. La leggenda dice che se getti una moneta oltre la spalla nella fontana, tornerai a Roma.',
        description: 'La fontana più famosa di Roma',
        historicalInfo: 'La Fontana di Trevi è la più grande fontana barocca della città e una delle fontane più famose del mondo. Alta 26,3 metri e larga 49,15 metri, è la fontana barocca più grande della città.',
        yearBuilt: '1732-1762',
        architect: 'Nicola Salvi'
      },
      ko: {
        name: '트레비 분수',
        narration: '이곳은 트레비 분수입니다. 전설에 따르면 분수에 어깨 너머로 동전을 던지면 로마로 다시 돌아온다고 합니다.',
        description: '로마에서 가장 유명한 분수',
        detailedDescription: '트레비 분수, 또는 폰타나 디 트레비는 로마에서 가장 크고 장엄한 바로크 양식의 분수로, 매년 수백만 명의 방문객을 그 웅장함, 아름다움, 전설적인 전통으로 매료시킵니다. 높이 26.3미터(86피트), 너비 49.15미터(161피트)의 인상적인 크기를 자랑하는 이 기념비적 걸작은 작은 트레비 광장을 지배하며 물, 대리석, 조각 예술의 숨막히는 광경을 연출합니다. 분수의 역사는 고대 로마로 거슬러 올라가며, 도시에 물을 공급하는 가장 오래된 수원 중 하나인 아쿠아 비르고 수로의 종점을 표시했습니다. 전설에 따르면 기원전 19년 목마른 로마 군인들을 이 수원으로 안내한 어린 처녀에서 수로의 이름이 유래했다고 합니다. 수세기 동안 단순한 물받이가 수로의 물을 모았지만, 1629년 교황 우르바노 8세가 지안 로렌조 베르니니에게 더 극적인 분수를 만들도록 의뢰했습니다. 그러나 교황이 사망하면서 프로젝트는 중단되었고, 1732년이 되어서야 교황 클레멘스 12세가 그 장소에 걸맞은 웅장한 분수를 설계하는 경쟁을 시작했습니다. 니콜라 살비가 위임을 받아 1732년 건설이 시작되었지만, 살비는 자신의 걸작이 완성되는 것을 보지 못했습니다. 분수는 마침내 1762년 주세페 파니니에 의해 건설 시작 30년 후에 완성되었습니다. 분수의 디자인은 바다의 티탄 신 오케아누스가 두 마리의 해마 - 한 마리는 거칠고 한 마리는 온순한 - 가 끄는 조개껍질 모양의 전차를 타는 장엄한 묘사를 중심으로 합니다. 이는 바다의 다양한 기분을 나타냅니다. 이 웅장한 생물들은 소라 껍질을 부는 모습으로 묘사된 신화 속 바다의 신 트리톤들에 의해 인도됩니다. 오케아누스를 수용하는 중앙 벽감은 두 개의 우화적 인물로 둘러싸여 있습니다: 왼쪽의 풍요의 뿔을 들고 있는 풍요와 오른쪽의 뱀이 마시는 컵을 들고 있는 건강으로, 웰빙과 번영을 상징합니다. 이 벽감 위의 부조 조각은 처녀가 샘을 발견하는 모습과 아그리파가 수로 건설을 승인하는 모습을 묘사합니다. 분수 뒤의 건물 외관은 궁전 정면으로 설계되어 분수가 자연스러운 건축 환경의 일부인 것처럼 보이게 합니다. 가장 유명한 전통은 분수에 동전을 던지는 것입니다: 한 개는 로마로의 귀환을 보장하고, 두 개는 새로운 로맨스로 이어지며, 세 개는 결혼으로 이어진다고 합니다. 매년 약 140만 유로의 동전이 분수에 던져지며, 이는 모두 수집되어 로마의 빈곤층을 돕는 자선 단체에 기부됩니다. 트레비 분수는 많은 영화에 등장했으며, 가장 유명한 것은 아니타 에크베리와 마르첼로 마스트로얀니가 주연한 페데리코 펠리니의 "라 돌체 비타"입니다. 오늘날 하루 평균 12,000명의 방문객이 이 상징적인 분수를 방문하여 사진을 찍고, 동전을 던지고, 로마에서 가장 아름다운 바로크 예술 작품 중 하나를 감상합니다.',
        historicalInfo: '트레비 분수는 도시에서 가장 큰 바로크 양식의 분수이자 세계에서 가장 유명한 분수 중 하나입니다. 높이 26.3미터, 너비 49.15미터로 도시에서 가장 큰 바로크 분수입니다.',
        yearBuilt: '1732-1762년',
        architect: '니콜라 살비'
      },
      es: {
        name: 'Fontana de Trevi',
        narration: 'Esta es la Fontana de Trevi. La leyenda dice que si lanzas una moneda por encima del hombro a la fuente, volverás a Roma.',
        description: 'La fuente más famosa de Roma',
        detailedDescription: 'La Fontana di Trevi es la fuente barroca más grande y espectacular de Roma, cautivando a millones de visitantes cada año con su grandeza, belleza y tradiciones legendarias. Con unas impresionantes dimensiones de 26,3 metros de altura y 49,15 metros de ancho, esta obra maestra domina la pequeña plaza de Trevi. La historia de la fuente comienza en la antigua Roma, donde marcaba el punto terminal del acueducto Aqua Virgo. El diseño se centra en una majestuosa representación de Océano, montando un carro en forma de concha tirado por dos caballos marinos. La tradición más famosa es el ritual de lanzar monedas: lanzar una moneda sobre el hombro izquierdo con la mano derecha asegura el regreso a Roma.',
        historicalInfo: 'La Fontana de Trevi es la fuente barroca más grande de la ciudad y una de las fuentes más famosas del mundo. Con 26,3 metros de altura y 49,15 metros de ancho, es la fuente barroca más grande de la ciudad.',
        yearBuilt: '1732-1762',
        architect: 'Nicola Salvi'
      },
      fr: {
        name: 'Fontaine de Trevi',
        narration: 'Voici la Fontaine de Trevi. La légende dit que si vous jetez une pièce par-dessus votre épaule dans la fontaine, vous reviendrez à Rome.',
        description: 'La fontaine la plus célèbre de Rome',
        detailedDescription: 'La Fontaine de Trevi, ou Fontana di Trevi, se dresse comme la plus grande et la plus spectaculaire fontaine baroque de Rome, captivant des millions de visiteurs chaque année par sa grandeur, sa beauté et ses traditions légendaires. Mesurant 26,3 mètres de haut et 49,15 mètres de large, ce chef-d\'œuvre monumental domine la petite place de Trevi, créant un spectacle époustouflant d\'eau, de marbre et d\'art sculptural. L\'histoire de la fontaine remonte à la Rome antique, où elle marquait le point terminal de l\'aqueduc Aqua Virgo, l\'une des plus anciennes sources d\'eau alimentant la ville. La légende raconte qu\'une jeune vierge conduisit des soldats romains assoiffés à cette source d\'eau en 19 av. J.-C., donnant son nom à l\'aqueduc. Pendant des siècles, un simple bassin recueillait les eaux de l\'aqueduc jusqu\'à ce que le pape Urbain VIII commande à Gian Lorenzo Bernini de créer une fontaine plus dramatique en 1629. Cependant, le projet fut abandonné à la mort du pape, et ce n\'est qu\'en 1732 que le pape Clément XII lança un concours pour concevoir une grande fontaine digne de l\'emplacement. Nicola Salvi remporta la commande et la construction commença en 1732, bien que Salvi ne vécut pas pour voir son chef-d\'œuvre achevé. La fontaine fut finalement terminée en 1762 par Giuseppe Pannini, trente ans après le début de la construction. Le design de la fontaine est centré sur une majestueuse représentation d\'Océan, le dieu Titan de la mer, chevauchant un char en forme de coquillage tiré par deux hippocampes - l\'un sauvage et l\'autre docile - représentant les humeurs changeantes de l\'océan. La tradition la plus célèbre est le rituel du lancer de pièces : jeter une pièce par-dessus son épaule gauche avec la main droite assure le retour à Rome. Aujourd\'hui, la Fontaine de Trevi reste l\'un des monuments les plus aimés de Rome et la fontaine la plus visitée au monde.',
        historicalInfo: 'La Fontaine de Trevi est la plus grande fontaine baroque de la ville et l\'une des fontaines les plus célèbres du monde. Mesurant 26,3 mètres de haut et 49,15 mètres de large, c\'est la plus grande fontaine baroque de la ville.',
        yearBuilt: '1732-1762',
        architect: 'Nicola Salvi'
      },
      de: {
        name: 'Trevi-Brunnen',
        narration: 'Dies ist der Trevi-Brunnen. Die Legende besagt, dass Sie nach Rom zurückkehren werden, wenn Sie eine Münze über Ihre Schulter in den Brunnen werfen.',
        description: 'Der berühmteste Brunnen Roms',
        detailedDescription: 'Der Trevi-Brunnen, oder Fontana di Trevi, steht als Roms größter und spektakulärster Barockbrunnen, der jedes Jahr Millionen von Besuchern mit seiner Pracht, Schönheit und legendären Traditionen bezaubert. Mit beeindruckenden 26,3 Metern Höhe und 49,15 Metern Breite dominiert dieses monumentale Meisterwerk den kleinen Trevi-Platz und schafft ein atemberaubendes Schauspiel aus Wasser, Marmor und Skulpturkunst. Die Geschichte des Brunnens beginnt im antiken Rom, wo er den Endpunkt des Aqua-Virgo-Aquädukts markierte, einer der ältesten Wasserquellen der Stadt. Die Legende erzählt, dass eine junge Jungfrau im Jahr 19 v. Chr. durstige römische Soldaten zu dieser Wasserquelle führte und damit dem Aquädukt seinen Namen gab. Jahrhundertelang sammelte ein einfaches Becken das Wasser des Aquädukts, bis Papst Urban VIII. 1629 Gian Lorenzo Bernini beauftragte, einen dramatischeren Brunnen zu erschaffen. Das Projekt wurde jedoch nach dem Tod des Papstes aufgegeben, und erst 1732 startete Papst Clemens XII. einen Wettbewerb zur Gestaltung eines großartigen Brunnens, der des Standorts würdig wäre. Nicola Salvi gewann den Auftrag und der Bau begann 1732, obwohl Salvi die Vollendung seines Meisterwerks nicht mehr erleben sollte. Der Brunnen wurde schließlich 1762 von Giuseppe Pannini vollendet, dreißig Jahre nach Baubeginn. Das Design des Brunnens konzentriert sich auf eine majestätische Darstellung von Oceanus, dem Titanengott des Meeres, der auf einem muschelförmigen Wagen reitet, der von zwei Seepferden gezogen wird - eines wild und eines zahm - die die wechselnden Stimmungen des Ozeans darstellen. Die berühmteste Tradition ist das Münzwurf-Ritual: Eine Münze über die linke Schulter mit der rechten Hand zu werfen, sichert die Rückkehr nach Rom. Heute bleibt der Trevi-Brunnen eines der beliebtesten Wahrzeichen Roms und der meistbesuchte Brunnen der Welt.',
        historicalInfo: 'Der Trevi-Brunnen ist der größte Barockbrunnen der Stadt und einer der berühmtesten Brunnen der Welt. Mit 26,3 Metern Höhe und 49,15 Metern Breite ist er der größte Barockbrunnen der Stadt.',
        yearBuilt: '1732-1762',
        architect: 'Nicola Salvi'
      },
      zh: {
        name: '特莱维喷泉',
        narration: '这是特莱维喷泉。传说如果你把硬币从肩膀上扔进喷泉，你会重返罗马。',
        description: '罗马最著名的喷泉',
        detailedDescription: '特莱维喷泉，或称为许愿池(Fontana di Trevi)，是罗马最大、最壮观的巴洛克喷泉，每年以其宏伟、美丽和传奇传统吸引数百万游客。这座纪念碑式的杰作高26.3米(86英尺)，宽49.15米(161英尺)，令人印象深刻，主导着小小的特莱维广场，创造出水、大理石和雕塑艺术的惊人景观。喷泉的历史始于古罗马，它标志着为城市供水的最古老水源之一——处女水道(Aqua Virgo)的终点。传说公元前19年，一位年轻处女将口渴的罗马士兵带到这个水源，水道因此得名。几个世纪以来，一个简单的水盆收集着水道的水，直到1629年教皇乌尔班八世委托济安·洛伦佐·贝尼尼创作一座更具戏剧性的喷泉。然而，教皇去世后项目被搁置，直到1732年教皇克莱门特十二世才发起竞赛，设计一座与这个位置相称的宏伟喷泉。尼古拉·萨尔维赢得委托，1732年开始建设，尽管萨尔维未能看到自己的杰作完成。喷泉最终于1762年由朱塞佩·帕尼尼完成，距离开工已过去30年。喷泉的设计以海洋泰坦神俄刻阿诺斯的雄伟形象为中心，他乘坐贝壳形战车，由两匹海马拉着——一匹狂野，一匹温顺——代表海洋变化的情绪。这些壮丽的生物由特里同引导，这些神话中的海神被描绘为吹响海螺。容纳俄刻阿诺斯的中央壁龛两侧是两个寓言人物：左侧是手持丰饶之角的丰饶女神，右侧是手持杯子让蛇饮用的健康女神，象征着幸福和繁荣。这些壁龛上方的浮雕雕塑描绘了处女发现泉水和阿格里帕批准建造水道的场景。喷泉后面的建筑立面被设计成宫殿正面，使喷泉看起来像是自然建筑环境的一部分。最著名的传统是向喷泉投掷硬币：一枚确保重返罗马，两枚带来新恋情，三枚带来婚姻。每年约有140万欧元的硬币被投入喷泉，所有硬币都被收集并捐赠给帮助罗马贫困人口的慈善机构。特莱维喷泉在许多电影中出现，最著名的是费德里科·费里尼执导、安妮塔·艾克伯格和马塞洛·马斯楚安尼主演的《甜蜜的生活》。如今，平均每天有12,000名游客参观这座标志性喷泉，拍照留念、投掷硬币，欣赏罗马最美丽的巴洛克艺术作品之一。',
        historicalInfo: '特莱维喷泉是城市中最大的巴洛克喷泉，也是世界上最著名的喷泉之一。高26.3米，宽49.15米，是城市中最大的巴洛克喷泉。',
        yearBuilt: '1732-1762年',
        architect: '尼古拉·萨尔维'
      },
      ja: {
        name: 'トレビの泉',
        narration: 'これがトレビの泉です。伝説によれば、肩越しにコインを投げ入れるとローマに戻ってくることができます。',
        description: 'ローマで最も有名な噴水',
        detailedDescription: 'トレビの泉、またはフォンタナ・ディ・トレヴィは、ローマ最大かつ最も壮観なバロック様式の噴水として、その壮大さ、美しさ、そして伝説的な伝統で毎年数百万人の訪問者を魅了しています。高さ26.3メートル(86フィート)、幅49.15メートル(161フィート)という印象的なサイズのこの記念碑的傑作は、小さなトレビ広場を支配し、水、大理石、彫刻芸術の息をのむような光景を作り出しています。噴水の歴史は古代ローマに始まり、都市に水を供給する最も古い水源の一つであるアクア・ヴィルゴ水道の終点を示していました。伝説によると、紀元前19年に喉の渇いたローマ兵をこの水源に導いた若い処女から水道の名前が付けられたといいます。何世紀もの間、単純な水盤が水道の水を集めていましたが、1629年に教皇ウルバヌス8世がジャン・ロレンツォ・ベルニーニにより劇的な噴水の制作を依頼しました。しかし、教皇の死によりプロジェクトは放棄され、1732年になって教皇クレメンス12世がこの場所にふさわしい壮大な噴水を設計するコンペティションを開始しました。ニコラ・サルヴィが委託を獲得し、1732年に建設が始まりましたが、サルヴィは自身の傑作の完成を見ることはありませんでした。噴水は最終的に1762年、建設開始から30年後にジュゼッペ・パニーニによって完成しました。噴水のデザインは、海のティタン神オケアノスが2頭の海馬 - 1頭は荒々しく1頭は従順 - に引かれた貝殻形の戦車に乗る壮大な描写を中心としており、海の様々な気分を表しています。これらの壮大な生き物は、法螺貝を吹く姿で描かれた神話上の海の神トリトンたちに導かれています。オケアノスを収容する中央のニッチは2つの寓意的な人物に挟まれています：左側の豊穣の角を持つ豊饒と、右側の蛇が飲む杯を持つ健康で、幸福と繁栄を象徴しています。これらのニッチの上の浮き彫り彫刻は、処女による泉の発見とアグリッパによる水道建設の承認を描いています。噴水の後ろの建物のファサードは宮殿の正面として設計されており、噴水が自然な建築環境の一部であるかのように見えます。最も有名な伝統は噴水にコインを投げることです：1枚はローマへの帰還を保証し、2枚は新しいロマンスにつながり、3枚は結婚につながるとされています。毎年約140万ユーロのコインが噴水に投げられ、すべて回収されローマの貧しい人々を支援する慈善団体に寄付されます。トレビの泉は多くの映画に登場しており、最も有名なのはアニタ・エクバーグとマルチェロ・マストロヤンニが主演したフェデリコ・フェリーニの「甘い生活」です。今日、1日平均12,000人の訪問者がこの象徴的な噴水を訪れ、写真を撮り、コインを投げ、ローマで最も美しいバロック芸術作品の一つを鑑賞しています。',
        historicalInfo: 'トレビの泉は市内最大のバロック様式の噴水であり、世界で最も有名な噴水の一つです。高さ26.3メートル、幅49.15メートルで、市内最大のバロック様式の噴水です。',
        yearBuilt: '1732-1762年',
        architect: 'ニコラ・サルヴィ'
      },
      pt: {
        name: 'Fontana di Trevi',
        narration: 'Esta é a Fontana di Trevi. A lenda diz que se você jogar uma moeda por cima do ombro na fonte, você retornará a Roma.',
        description: 'A fonte mais famosa de Roma',
        detailedDescription: 'A Fontana di Trevi ergue-se como a maior e mais espetacular fonte barroca de Roma, cativando milhões de visitantes a cada ano com sua grandeza, beleza e tradições lendárias. Com impressionantes 26,3 metros de altura e 49,15 metros de largura, esta obra-prima monumental domina a pequena Praça Trevi, criando um espetáculo deslumbrante de água, mármore e arte escultural. A história da fonte começa na Roma Antiga, onde marcava o ponto terminal do aqueduto Aqua Virgo, uma das fontes de água mais antigas que abastecia a cidade. A lenda conta que uma jovem virgem levou soldados romanos sedentos a esta fonte de água em 19 a.C., dando nome ao aqueduto. Durante séculos, uma simples bacia coletava as águas do aqueduto até que o Papa Urbano VIII encomendou a Gian Lorenzo Bernini a criação de uma fonte mais dramática em 1629. No entanto, o projeto foi abandonado quando o Papa morreu, e somente em 1732 o Papa Clemente XII lançou um concurso para projetar uma grande fonte digna do local. Nicola Salvi venceu a encomenda e a construção começou em 1732, embora Salvi não tenha vivido para ver sua obra-prima concluída. A fonte foi finalmente concluída em 1762 por Giuseppe Pannini, trinta anos após o início da construção. O design da fonte centra-se em uma majestosa representação de Oceano, o deus Titã do mar, montando uma carruagem em forma de concha puxada por dois cavalos-marinhos - um selvagem e outro dócil - representando os humores variados do oceano. A tradição mais famosa é o ritual de jogar moedas: jogar uma moeda sobre o ombro esquerdo com a mão direita garante o retorno a Roma. Hoje, a Fontana di Trevi continua sendo um dos marcos mais amados de Roma e a fonte mais visitada do mundo.',
        historicalInfo: 'A Fontana di Trevi é a maior fonte barroca da cidade e uma das fontes mais famosas do mundo. Com 26,3 metros de altura e 49,15 metros de largura, é a maior fonte barroca da cidade.',
        yearBuilt: '1732-1762',
        architect: 'Nicola Salvi'
      },
      ru: {
        name: 'Фонтан Треви',
        narration: 'Это фонтан Треви. Легенда гласит, что если бросить монету через плечо в фонтан, вы вернетесь в Рим.',
        description: 'Самый знаменитый фонтан Рима',
        detailedDescription: 'Фонтан Треви, или Фонтана ди Треви, является крупнейшим и самым впечатляющим барочным фонтаном Рима, очаровывающим миллионы посетителей каждый год своим величием, красотой и легендарными традициями. С впечатляющими размерами 26,3 метра в высоту и 49,15 метра в ширину, этот монументальный шедевр доминирует над небольшой площадью Треви, создавая захватывающее зрелище воды, мрамора и скульптурного искусства. История фонтана начинается в Древнем Риме, где он отмечал конечную точку акведука Аква Вирго, одного из старейших источников воды, снабжавших город. Легенда гласит, что молодая девственница привела жаждущих римских солдат к этому источнику воды в 19 году до н.э., дав название акведуку. На протяжении веков простой бассейн собирал воды акведука, пока Папа Урбан VIII не поручил Джан Лоренцо Бернини создать более драматичный фонтан в 1629 году. Однако проект был заброшен после смерти Папы, и только в 1732 году Папа Климент XII объявил конкурс на проектирование величественного фонтана, достойного этого места. Никола Сальви выиграл заказ, и строительство началось в 1732 году, хотя Сальви не суждено было увидеть свой шедевр завершенным. Фонтан был наконец завершен в 1762 году Джузеппе Паннини, через тридцать лет после начала строительства. Дизайн фонтана сосредоточен на величественном изображении Океана, бога-титана моря, едущего на колеснице в форме раковины, запряженной двумя морскими конями — одним диким и одним послушным — представляющими переменчивые настроения океана. Самая известная традиция — ритуал бросания монет: бросить монету через левое плечо правой рукой обеспечивает возвращение в Рим. Сегодня фонтан Треви остается одной из самых любимых достопримечательностей Рима и самым посещаемым фонтаном в мире.',
        historicalInfo: 'Фонтан Треви — самый большой фонтан в стиле барокко в городе и один из самых известных фонтанов в мире. Высотой 26,3 метра и шириной 49,15 метра, это самый большой фонтан в стиле барокко в городе.',
        yearBuilt: '1732-1762 гг.',
        architect: 'Никола Сальви'
      }
    }
  },
  {
    id: 'pantheon',
    cityId: 'rome',
    name: 'Pantheon',
    lat: 41.898609,
    lng: 12.476873,
    radius: 50,
    narration: 'The Pantheon is a temple dedicated to all the gods. It is a masterpiece of ancient architecture with its magnificent dome.',
    description: 'An architectural marvel with the world\'s largest unreinforced concrete dome',
    category: 'Ancient Rome',
    detailedDescription: 'The Pantheon stands as one of the best-preserved monuments of ancient Rome and represents one of the most influential buildings in the history of architecture. This remarkable structure, whose name derives from the Greek words "pan" (all) and "theos" (gods), meaning "temple to all gods," continues to inspire architects and visitors nearly two millennia after its construction. The building we see today was commissioned by Emperor Hadrian around 126 AD, though it replaced an earlier temple built by Marcus Agrippa in 27 BC, whose name still appears in the inscription on the portico. What makes the Pantheon truly extraordinary is its massive dome, which remains the world\'s largest unreinforced concrete dome even after nearly 2,000 years. Measuring 43.3 meters (142 feet) in both diameter and height from the floor to the oculus, the dome creates a perfect hemisphere, embodying the Roman architectural ideal of geometric harmony. This architectural marvel was achieved through ingenious engineering techniques that modern builders still study and admire. The concrete used in construction varies in composition throughout the dome\'s height, with heavier aggregates like travertine and brick at the base transitioning to lighter materials like pumice at the apex, reducing the overall weight while maintaining structural integrity. The thickness of the dome also decreases from 6.4 meters at the base to just 1.2 meters at the oculus, further optimizing its weight distribution. The most striking feature of the Pantheon\'s interior is the oculus, a circular opening 8.2 meters (27 feet) in diameter at the dome\'s apex. This remarkable architectural element serves as the building\'s only source of natural light, creating a dramatic beam of sunlight that moves across the interior throughout the day, illuminating different architectural features and creating an ever-changing interplay of light and shadow. The oculus is open to the elements, allowing rain to enter the building, but the floor is slightly convex with drainage holes to channel water away. The symbolic significance of this opening extends beyond its practical purpose - it represents the connection between the temple and the heavens, the dwelling place of the gods to whom the building was dedicated. The Pantheon\'s portico features sixteen massive Corinthian columns, each carved from a single piece of Egyptian granite, standing 11.8 meters (39 feet) tall and weighing approximately 60 tons each. These columns support a triangular pediment that once contained bronze sculptures, though these were removed over the centuries. The bronze that once covered the portico ceiling beams was also stripped away, reportedly taken by Byzantine Emperor Constans II in 663 AD. The building\'s perfect proportions and harmonious design influenced countless structures throughout history. During the Renaissance, artists and architects like Michelangelo, Raphael, and Brunelleschi studied the Pantheon intensively, drawing inspiration from its perfect geometry and innovative construction techniques. Raphael himself is buried here, along with several Italian kings and other notable figures. In 609 AD, Byzantine Emperor Phocas gave the Pantheon to Pope Boniface IV, who converted it into a Christian church dedicated to "St. Mary and the Martyrs," a transformation that ultimately saved the building from the destruction and plundering that befell many other Roman temples. This conversion to a church ensured its continuous maintenance and preservation through the medieval period and beyond. The building has witnessed numerous historical events and transformations. During the Renaissance, it briefly served as a fortress, and in the 17th century, Pope Urban VIII controversially removed the bronze from the portico to make cannons for Castel Sant\'Angelo and to create Bernini\'s baldachin in St. Peter\'s Basilica, an act that gave rise to the saying "What the barbarians didn\'t do, the Barberini did" - a play on the Pope\'s family name. Today, the Pantheon remains an active church where Mass is celebrated, particularly on important occasions, while simultaneously serving as one of Rome\'s most visited tourist attractions and a burial place for distinguished Italians. The building stands as a testament to Roman engineering genius, religious continuity, and architectural perfection, continuing to inspire wonder and admiration in all who enter its sacred space and gaze up at the magnificent dome with its oculus open to the sky.',
    photos: [
      'https://images.unsplash.com/photo-1555992258-ecd66771df1c?w=800',
      'https://images.unsplash.com/photo-1604924413347-a8c0e20e6635?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800'
    ],
    historicalInfo: 'The Pantheon is a former Roman temple and, since 609 AD, a Catholic church. It is the best-preserved of all Ancient Roman buildings and has been in continuous use throughout its history.',
    yearBuilt: '126 AD',
    architect: 'Emperor Hadrian',
    translations: {
      en: {
        name: 'Pantheon',
        narration: 'The Pantheon is a temple dedicated to all the gods. It is a masterpiece of ancient architecture with its magnificent dome.',
        description: 'An architectural marvel with the world\'s largest unreinforced concrete dome',
        detailedDescription: 'The Pantheon stands as one of the best-preserved monuments of ancient Rome and represents one of the most influential buildings in the history of architecture. This remarkable structure, whose name derives from the Greek words "pan" (all) and "theos" (gods), meaning "temple to all gods," continues to inspire architects and visitors nearly two millennia after its construction. The building we see today was commissioned by Emperor Hadrian around 126 AD, though it replaced an earlier temple built by Marcus Agrippa in 27 BC, whose name still appears in the inscription on the portico. What makes the Pantheon truly extraordinary is its massive dome, which remains the world\'s largest unreinforced concrete dome even after nearly 2,000 years. Measuring 43.3 meters (142 feet) in both diameter and height from the floor to the oculus, the dome creates a perfect hemisphere, embodying the Roman architectural ideal of geometric harmony. This architectural marvel was achieved through ingenious engineering techniques that modern builders still study and admire. The concrete used in construction varies in composition throughout the dome\'s height, with heavier aggregates like travertine and brick at the base transitioning to lighter materials like pumice at the apex, reducing the overall weight while maintaining structural integrity. The thickness of the dome also decreases from 6.4 meters at the base to just 1.2 meters at the oculus, further optimizing its weight distribution. The most striking feature of the Pantheon\'s interior is the oculus, a circular opening 8.2 meters (27 feet) in diameter at the dome\'s apex. This remarkable architectural element serves as the building\'s only source of natural light, creating a dramatic beam of sunlight that moves across the interior throughout the day, illuminating different architectural features and creating an ever-changing interplay of light and shadow. The oculus is open to the elements, allowing rain to enter the building, but the floor is slightly convex with drainage holes to channel water away. The symbolic significance of this opening extends beyond its practical purpose - it represents the connection between the temple and the heavens, the dwelling place of the gods to whom the building was dedicated. The Pantheon\'s portico features sixteen massive Corinthian columns, each carved from a single piece of Egyptian granite, standing 11.8 meters (39 feet) tall and weighing approximately 60 tons each. These columns support a triangular pediment that once contained bronze sculptures, though these were removed over the centuries. The bronze that once covered the portico ceiling beams was also stripped away, reportedly taken by Byzantine Emperor Constans II in 663 AD. The building\'s perfect proportions and harmonious design influenced countless structures throughout history. During the Renaissance, artists and architects like Michelangelo, Raphael, and Brunelleschi studied the Pantheon intensively, drawing inspiration from its perfect geometry and innovative construction techniques. Raphael himself is buried here, along with several Italian kings and other notable figures. In 609 AD, Byzantine Emperor Phocas gave the Pantheon to Pope Boniface IV, who converted it into a Christian church dedicated to "St. Mary and the Martyrs," a transformation that ultimately saved the building from the destruction and plundering that befell many other Roman temples. This conversion to a church ensured its continuous maintenance and preservation through the medieval period and beyond. The building has witnessed numerous historical events and transformations. During the Renaissance, it briefly served as a fortress, and in the 17th century, Pope Urban VIII controversially removed the bronze from the portico to make cannons for Castel Sant\'Angelo and to create Bernini\'s baldachin in St. Peter\'s Basilica, an act that gave rise to the saying "What the barbarians didn\'t do, the Barberini did" - a play on the Pope\'s family name. Today, the Pantheon remains an active church where Mass is celebrated, particularly on important occasions, while simultaneously serving as one of Rome\'s most visited tourist attractions and a burial place for distinguished Italians. The building stands as a testament to Roman engineering genius, religious continuity, and architectural perfection, continuing to inspire wonder and admiration in all who enter its sacred space and gaze up at the magnificent dome with its oculus open to the sky.'
      },
      it: {
        name: 'Pantheon',
        narration: 'Il Pantheon è un tempio dedicato a tutti gli dei. È un capolavoro dell\'architettura antica con la sua magnifica cupola.',
        description: 'Una meraviglia architettonica con la più grande cupola in calcestruzzo non armato del mondo',
        historicalInfo: 'Il Pantheon è un antico tempio romano e, dal 609 d.C., una chiesa cattolica. È il meglio conservato di tutti gli edifici dell\'antica Roma ed è stato in uso continuo per tutta la sua storia.',
        yearBuilt: '126 d.C.',
        architect: 'Imperatore Adriano'
      },
      ko: {
        name: '판테온',
        narration: '판테온은 모든 신들에게 헌정된 신전입니다. 웅장한 돔이 있는 고대 건축의 걸작입니다.',
        description: '세계에서 가장 큰 무근 콘크리트 돔을 가진 건축의 경이',
        detailedDescription: '판테온은 고대 로마에서 가장 잘 보존된 기념물 중 하나이며 건축사에서 가장 영향력 있는 건물 중 하나입니다. 그리스어 "pan"(모든)과 "theos"(신)에서 유래한 이름으로 "모든 신들의 신전"을 의미하며, 건설된 지 거의 2천 년이 지난 지금도 건축가와 방문객들에게 영감을 주고 있습니다. 오늘날 우리가 보는 건물은 서기 126년경 하드리아누스 황제가 의뢰했지만, 서기 27년 마르쿠스 아그리파가 지은 이전 신전을 대체한 것으로 그의 이름은 여전히 현관의 비문에 남아있습니다. 판테온을 진정으로 특별하게 만드는 것은 거대한 돔으로, 거의 2,000년이 지난 지금도 세계에서 가장 큰 무근 콘크리트 돔으로 남아있습니다. 바닥에서 오큘루스까지 직경과 높이가 모두 43.3미터(142피트)로 측정되는 돔은 완벽한 반구를 만들어 로마 건축의 기하학적 조화 이상을 구현합니다. 건설에 사용된 콘크리트는 돔 높이에 따라 구성이 다양하며, 바닥의 트라버틴과 벽돌 같은 무거운 골재에서 정점의 경석 같은 가벼운 재료로 전환되어 구조적 무결성을 유지하면서 전체 무게를 줄입니다. 돔의 두께도 바닥의 6.4미터에서 오큘루스의 1.2미터로 감소하여 무게 분산을 더욱 최적화합니다. 판테온 내부의 가장 인상적인 특징은 돔 꼭대기의 직경 8.2미터(27피트)의 원형 개구부인 오큘루스입니다. 이 놀라운 건축 요소는 건물의 유일한 자연광원 역할을 하며, 하루 종일 내부를 가로질러 이동하는 극적인 햇빛 기둥을 만들어 다양한 건축적 특징을 비추고 빛과 그림자의 끊임없이 변화하는 상호작용을 만들어냅니다. 방문객들은 비가 오는 날에도 오큘루스를 통해 비가 들어오는 것을 볼 수 있으며, 바닥의 배수 시스템이 물을 효과적으로 처리합니다. 방문 팁: 아침 일찍 방문하면 군중을 피하고 오큘루스를 통해 들어오는 아름다운 아침 햇살을 즐길 수 있으며, 입장료는 무료이지만 오디오 가이드는 유료입니다.',
        historicalInfo: '판테온은 고대 로마 신전이었으며 서기 609년부터 가톨릭 교회로 사용되고 있습니다. 고대 로마 건축물 중 가장 잘 보존되어 있으며 역사 전체에 걸쳐 지속적으로 사용되어 왔습니다.',
        yearBuilt: '서기 126년',
        architect: '하드리아누스 황제'
      },
      es: {
        name: 'Panteón',
        narration: 'El Panteón es un templo dedicado a todos los dioses. Es una obra maestra de la arquitectura antigua con su magnífica cúpula.',
        description: 'Una maravilla arquitectónica con la cúpula de hormigón sin refuerzo más grande del mundo',
        detailedDescription: 'El Panteón se erige como uno de los edificios antiguos mejor conservados de Roma. Construido originalmente como templo dedicado a todos los dioses del panteón romano, esta notable estructura ha permanecido en uso continuo durante casi dos milenios. El edificio actual fue completado alrededor del año 126 d.C. bajo el emperador Adriano. La característica más impresionante es su extraordinaria cúpula de hormigón no reforzado, que sigue siendo la más grande del mundo con 43,3 metros de diámetro interior. El óculo de 8,7 metros es la única fuente de luz natural del interior.',
        historicalInfo: 'El Panteón es un antiguo templo romano y, desde el 609 d.C., una iglesia católica. Es el mejor conservado de todos los edificios de la Antigua Roma y ha estado en uso continuo a lo largo de su historia.',
        yearBuilt: '126 d.C.',
        architect: 'Emperador Adriano'
      },
      fr: {
        name: 'Panthéon',
        narration: 'Le Panthéon est un temple dédié à tous les dieux. C\'est un chef-d\'œuvre de l\'architecture antique avec son magnifique dôme.',
        description: 'Une merveille architecturale avec la plus grande coupole en béton non armé du monde',
        detailedDescription: 'Le Panthéon se dresse comme l\'un des bâtiments antiques les mieux préservés de Rome. Construit à l\'origine comme temple dédié à tous les dieux du panthéon romain, cette remarquable structure est restée en usage continu pendant près de deux millénaires. Le bâtiment actuel a été achevé vers 126 après J.-C. sous l\'empereur Hadrien. La caractéristique la plus impressionnante est son extraordinaire dôme en béton non armé, qui reste le plus grand au monde avec un diamètre intérieur de 43,3 mètres. L\'oculus de 8,7 mètres est la seule source de lumière naturelle de l\'intérieur.',
        historicalInfo: 'Le Panthéon est un ancien temple romain et, depuis 609 apr. J.-C., une église catholique. C\'est le mieux conservé de tous les bâtiments de la Rome antique et a été en usage continu tout au long de son histoire.',
        yearBuilt: '126 apr. J.-C.',
        architect: 'Empereur Hadrien'
      },
      de: {
        name: 'Pantheon',
        narration: 'Das Pantheon ist ein Tempel, der allen Göttern gewidmet ist. Es ist ein Meisterwerk antiker Architektur mit seiner prächtigen Kuppel.',
        description: 'Ein architektonisches Wunderwerk mit der größten unbewehrten Betonkuppel der Welt',
        detailedDescription: 'Das Pantheon steht als eines der am besten erhaltenen antiken Gebäude Roms und repräsentiert den Höhepunkt römischer Ingenieurskunst und architektonischen Designs. Ursprünglich als Tempel erbaut, der allen Göttern des römischen Pantheons gewidmet war, ist dieses bemerkenswerte Bauwerk seit fast zwei Jahrtausenden ununterbrochen in Gebrauch und dient seit dem 7. Jahrhundert als katholische Kirche. Das heutige Gebäude wurde um 126 n. Chr. unter Kaiser Hadrian fertiggestellt, obwohl der Name Marcus Agrippa, der einen früheren Tempel an derselben Stelle im Jahr 27 v. Chr. errichtete, auf dem Giebel eingraviert bleibt. Das beeindruckendste Merkmal des Pantheons ist seine außergewöhnliche Kuppel aus unbewehrtem Beton, die mit einem Innendurchmesser von 43,3 Metern - genau gleich der Höhe des Gebäudes vom Boden bis zum Oculus - die größte unbewehrte Betonkuppel der Welt bleibt. Der Oculus, eine 8,7 Meter große kreisförmige Öffnung an der Spitze der Kuppel, ist die einzige natürliche Lichtquelle des Innenraums und erzeugt einen sich ständig bewegenden Lichtstrahl, der den Raum durchquert, während die Sonne über den Himmel wandert. Das Pantheon beherbergt die Gräber mehrerer berühmter Italiener, darunter der Renaissance-Künstler Raphael und die Könige des modernen Italiens. Heute steht das Pantheon als Zeugnis des römischen Ingenieursgenies und inspiriert weiterhin jährlich Millionen von Besuchern.',
        historicalInfo: 'Das Pantheon ist ein ehemaliger römischer Tempel und seit 609 n. Chr. eine katholische Kirche. Es ist das am besten erhaltene aller antiken römischen Gebäude und wird seit seiner Geschichte durchgehend genutzt.',
        yearBuilt: '126 n. Chr.',
        architect: 'Kaiser Hadrian'
      },
      zh: {
        name: '万神殿',
        narration: '万神殿是一座献给所有神灵的神殿。它是古代建筑的杰作，拥有宏伟的圆顶。',
        description: '拥有世界上最大的无钢筋混凝土圆顶的建筑奇迹',
        detailedDescription: '万神殿是古罗马保存最完好的纪念碑之一，也是建筑史上最具影响力的建筑之一。这座非凡的建筑名称源自希腊语"pan"（所有）和"theos"（神），意为"所有神的神殿"，在建成近两千年后仍继续启发着建筑师和游客。我们今天看到的建筑是由哈德良皇帝在公元126年左右委托建造的，尽管它取代了公元前27年由马库斯·阿格里帕建造的早期神殿，他的名字仍然出现在门廊的铭文上。万神殿真正非凡之处在于其巨大的圆顶，即使在近2000年后，它仍然是世界上最大的无钢筋混凝土圆顶。圆顶从地板到顶部圆孔的直径和高度都是43.3米（142英尺），形成一个完美的半球体，体现了罗马建筑几何和谐的理想。建筑中使用的混凝土在整个圆顶高度上成分各不相同，从底部的石灰华和砖等较重的骨料过渡到顶部的浮石等较轻的材料，在保持结构完整性的同时减少整体重量。圆顶的厚度也从底部的6.4米减少到圆孔处的仅1.2米，进一步优化其重量分配。万神殿内部最引人注目的特征是圆孔，这是圆顶顶部直径8.2米（27英尺）的圆形开口。这个非凡的建筑元素是建筑唯一的自然光源，创造出戏剧性的阳光束，在一天中穿过内部移动，照亮不同的建筑特征，创造出不断变化的光影交织。圆孔向外开放，游客可以看到雨水进入，但地板的排水系统有效地处理了水。游览提示：清晨参观可以避开人群，欣赏透过圆孔进入的美丽晨光，入场免费但语音导览需付费。',
        historicalInfo: '万神殿是一座古罗马神殿，自公元609年起成为天主教堂。它是所有古罗马建筑中保存最完好的，并且在整个历史中一直被使用。',
        yearBuilt: '公元126年',
        architect: '哈德良皇帝'
      },
      ja: {
        name: 'パンテオン',
        narration: 'パンテオンは全ての神々に捧げられた神殿です。壮大なドームを持つ古代建築の傑作です。',
        description: '世界最大の無筋コンクリートドームを持つ建築の驚異',
        detailedDescription: 'パンテオンは古代ローマで最もよく保存された記念碑の一つであり、建築史上最も影響力のある建物の一つです。ギリシャ語の「pan」（すべて）と「theos」（神）に由来する名前は「すべての神々の神殿」を意味し、建設から約2千年を経た今も建築家や訪問者にインスピレーションを与え続けています。今日私たちが見る建物は紀元126年頃にハドリアヌス帝によって委託されましたが、紀元前27年にマルクス・アグリッパによって建てられた以前の神殿を置き換えたもので、彼の名前は今でもポルティコの碑文に残っています。パンテオンを真に特別なものにしているのは巨大なドームで、約2000年を経た今でも世界最大の無筋コンクリートドームです。床からオクルスまでの直径と高さがともに43.3メートル（142フィート）であるドームは完璧な半球を形成し、ローマ建築の幾何学的調和の理想を体現しています。建設に使用されたコンクリートはドームの高さ全体で組成が異なり、基部のトラバーチンやレンガなどの重い骨材から頂点の軽石などの軽い材料へと移行し、構造の完全性を維持しながら全体の重量を軽減しています。ドームの厚さも基部の6.4メートルからオクルスのわずか1.2メートルまで減少し、重量配分をさらに最適化しています。パンテオン内部の最も印象的な特徴はオクルス、ドーム頂点の直径8.2メートル（27フィート）の円形開口部です。この注目すべき建築要素は建物唯一の自然光源として機能し、一日を通して内部を横切って移動する劇的な太陽光の柱を作り出し、さまざまな建築的特徴を照らし、光と影の絶え間なく変化する相互作用を生み出します。オクルスは外部に開放されており、訪問者は雨が入るのを見ることができますが、床の排水システムが効果的に水を処理します。訪問のヒント：早朝に訪れると混雑を避け、オクルスから入る美しい朝日を楽しむことができ、入場は無料ですがオーディオガイドは有料です。',
        historicalInfo: 'パンテオンはかつてローマの神殿で、609年からはカトリック教会として使用されています。古代ローマ建築の中で最もよく保存されており、その歴史を通じて継続的に使用されてきました。',
        yearBuilt: '紀元126年',
        architect: 'ハドリアヌス帝'
      },
      pt: {
        name: 'Panteão',
        narration: 'O Panteão é um templo dedicado a todos os deuses. É uma obra-prima da arquitetura antiga com sua magnífica cúpula.',
        description: 'Uma maravilha arquitetônica com a maior cúpula de concreto não reforçado do mundo',
        detailedDescription: 'O Panteão ergue-se como um dos edifícios antigos mais bem preservados de Roma. Originalmente construído como templo dedicado a todos os deuses do panteão romano, esta notável estrutura permaneceu em uso contínuo por quase dois milênios. O edifício atual foi concluído por volta de 126 d.C. sob o imperador Adriano. A característica mais impressionante é sua extraordinária cúpula de concreto não armado, que continua sendo a maior do mundo com 43,3 metros de diâmetro interno. O óculo de 8,7 metros é a única fonte de luz natural do interior.',
        historicalInfo: 'O Panteão é um antigo templo romano e, desde 609 d.C., uma igreja católica. É o mais bem preservado de todos os edifícios da Roma Antiga e está em uso contínuo ao longo de sua história.',
        yearBuilt: '126 d.C.',
        architect: 'Imperador Adriano'
      },
      ru: {
        name: 'Пантеон',
        narration: 'Пантеон — это храм, посвященный всем богам. Это шедевр древней архитектуры с великолепным куполом.',
        description: 'Архитектурное чудо с самым большим неармированным бетонным куполом в мире',
        detailedDescription: 'Пантеон является одним из наиболее хорошо сохранившихся древних зданий Рима. Первоначально построенный как храм, посвященный всем богам римского пантеона, это замечательное сооружение находится в непрерывном использовании на протяжении почти двух тысячелетий. Нынешнее здание было завершено около 126 года н.э. при императоре Адриане. Самой впечатляющей особенностью является его необыкновенный купол из неармированного бетона, который остается крупнейшим в мире с внутренним диаметром 43,3 метра. Окулус диаметром 8,7 метра является единственным источником естественного света внутри.',
        historicalInfo: 'Пантеон — бывший римский храм, с 609 года нашей эры — католическая церковь. Это наиболее хорошо сохранившееся из всех зданий Древнего Рима, которое непрерывно используется на протяжении всей своей истории.',
        yearBuilt: '126 г. н.э.',
        architect: 'Император Адриан'
      }
    }
  },
  {
    id: 'spanish_steps',
    cityId: 'rome',
    name: 'Spanish Steps',
    lat: 41.905991,
    lng: 12.482775,
    radius: 50,
    narration: 'Welcome to the Spanish Steps, famous as a filming location for the movie "Roman Holiday".',
    description: 'A monumental stairway of 135 steps',
    category: 'Landmark',
    detailedDescription: 'The Spanish Steps, known in Italian as "Scalinata di Trinità dei Monti," represent one of Rome\'s most beloved and photographed landmarks, gracefully connecting the Piazza di Spagna at the base with the Trinità dei Monti church and the Pincian Hill above. This monumental Baroque stairway consists of 135 steps divided into twelve flights, creating a theatrical cascade of travertine stone that has captivated visitors for three centuries. The steps take their English name from the Piazza di Spagna (Spanish Square) at their base, which in turn was named after the Spanish Embassy to the Holy See, located in the square since the 17th century. However, the steps were actually funded by French diplomacy, creating an amusing international confusion that persists to this day. The history of the Spanish Steps begins in the early 17th century when the steep slope between the Spanish Square and the church above proved difficult to navigate. Various proposals were put forward over the decades to create a grand stairway worthy of connecting these two important locations. The project languished for years due to disagreements between the French, who wanted to glorify the French monarchy, and the papacy, which sought to emphasize religious authority. Finally, French diplomat Étienne Gueffier bequeathed a substantial sum of money in his will for the construction of the steps, though it took until 1717 for Pope Clement XI to approve the project. The design competition was won by Francesco de Sanctis, whose elegant proposal drew inspiration from earlier sketches by Alessandro Specchi. Construction began in 1723 and was completed in 1725, creating the magnificent structure we see today. The steps\' design is a masterpiece of Baroque urban planning, featuring a butterfly or fan-like configuration that widens and narrows as it ascends, creating visual interest and accommodating the irregular terrain. The stairway is not merely functional but transforms the steep hillside into a theatrical space where Romans and visitors alike gather, rest, and socialize. At the base, the steps open onto Piazza di Spagna, home to the famous Barcaccia fountain, designed by Pietro Bernini and his more famous son Gian Lorenzo Bernini. This fountain, shaped like a half-sunken boat, provides a whimsical counterpoint to the grandeur of the steps above. At the summit, the twin-towered façade of the Trinità dei Monti church provides a commanding visual terminus, while offering spectacular views over Rome\'s rooftops. The steps have long been a gathering place for artists, writers, and travelers. During the 18th and 19th centuries, artists\' models would congregate on the steps, hoping to be hired by painters and sculptors working in the area. The adjacent houses where poets John Keats and Percy Bysshe Shelley once lived have become museums, adding literary significance to the location\'s artistic heritage. The Spanish Steps achieved immortal fame in cinema through their appearance in the 1953 film "Roman Holiday," where Audrey Hepburn\'s character enjoys gelato on the steps, creating one of cinema\'s most iconic moments and establishing the steps as a symbol of romance and la dolce vita. This scene helped cement the Spanish Steps as an essential stop on any Roman itinerary. In spring, the steps are adorned with magnificent displays of azaleas, transforming the white travertine into a cascade of pink and red blooms, a tradition that dates back centuries and creates one of Rome\'s most spectacular seasonal displays. Throughout the year, the steps serve as an impromptu theater, hosting fashion shows, concerts, and celebrations. The area surrounding the Spanish Steps has evolved into one of Rome\'s most fashionable shopping districts, with luxury boutiques lining the nearby streets, particularly Via Condotti, making it a destination for both culture and commerce. Recent restoration efforts have focused on preserving the steps for future generations. In 2015-2016, the monument underwent a comprehensive €1.5 million restoration sponsored by the jewelry house Bulgari, cleaning and repairing the travertine steps and strengthening their structural integrity. New regulations prohibit sitting on the steps and eating or drinking in the area, measures designed to protect this treasured monument from wear and damage. Despite these restrictions, the Spanish Steps remain one of Rome\'s most vibrant gathering places, where locals meet friends, tourists rest weary feet, and everyone pauses to admire the view and soak in the timeless beauty of this Baroque masterpiece that has graced the Roman landscape for three centuries.',
    photos: [
      'https://images.unsplash.com/photo-1559564323-2598bc839f43?w=800',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1636804907035-8ae6360f1d4f?w=800'
    ],
    historicalInfo: 'The Spanish Steps are a set of steps in Rome, climbing a steep slope between the Piazza di Spagna at the base and Piazza Trinità dei Monti, dominated by the Trinità dei Monti church at the top.',
    yearBuilt: '1723-1726',
    architect: 'Francesco de Sanctis and Alessandro Specchi',
    translations: {
      en: {
        name: 'Spanish Steps',
        narration: 'Welcome to the Spanish Steps, famous as a filming location for the movie "Roman Holiday".',
        description: 'A monumental stairway of 135 steps',
        detailedDescription: 'The Spanish Steps, known in Italian as "Scalinata di Trinità dei Monti," represent one of Rome\'s most beloved and photographed landmarks, gracefully connecting the Piazza di Spagna at the base with the Trinità dei Monti church and the Pincian Hill above. This monumental Baroque stairway consists of 135 steps divided into twelve flights, creating a theatrical cascade of travertine stone that has captivated visitors for three centuries. The steps take their English name from the Piazza di Spagna (Spanish Square) at their base, which in turn was named after the Spanish Embassy to the Holy See, located in the square since the 17th century. However, the steps were actually funded by French diplomacy, creating an amusing international confusion that persists to this day. The history of the Spanish Steps begins in the early 17th century when the steep slope between the Spanish Square and the church above proved difficult to navigate. Various proposals were put forward over the decades to create a grand stairway worthy of connecting these two important locations. The project languished for years due to disagreements between the French, who wanted to glorify the French monarchy, and the papacy, which sought to emphasize religious authority. Finally, French diplomat Étienne Gueffier bequeathed a substantial sum of money in his will for the construction of the steps, though it took until 1717 for Pope Clement XI to approve the project. The design competition was won by Francesco de Sanctis, whose elegant proposal drew inspiration from earlier sketches by Alessandro Specchi. Construction began in 1723 and was completed in 1725, creating the magnificent structure we see today. The steps\' design is a masterpiece of Baroque urban planning, featuring a butterfly or fan-like configuration that widens and narrows as it ascends, creating visual interest and accommodating the irregular terrain. The stairway is not merely functional but transforms the steep hillside into a theatrical space where Romans and visitors alike gather, rest, and socialize. At the base, the steps open onto Piazza di Spagna, home to the famous Barcaccia fountain, designed by Pietro Bernini and his more famous son Gian Lorenzo Bernini. This fountain, shaped like a half-sunken boat, provides a whimsical counterpoint to the grandeur of the steps above. At the summit, the twin-towered façade of the Trinità dei Monti church provides a commanding visual terminus, while offering spectacular views over Rome\'s rooftops. The steps have long been a gathering place for artists, writers, and travelers. During the 18th and 19th centuries, artists\' models would congregate on the steps, hoping to be hired by painters and sculptors working in the area. The adjacent houses where poets John Keats and Percy Bysshe Shelley once lived have become museums, adding literary significance to the location\'s artistic heritage. The Spanish Steps achieved immortal fame in cinema through their appearance in the 1953 film "Roman Holiday," where Audrey Hepburn\'s character enjoys gelato on the steps, creating one of cinema\'s most iconic moments and establishing the steps as a symbol of romance and la dolce vita. This scene helped cement the Spanish Steps as an essential stop on any Roman itinerary. In spring, the steps are adorned with magnificent displays of azaleas, transforming the white travertine into a cascade of pink and red blooms, a tradition that dates back centuries and creates one of Rome\'s most spectacular seasonal displays. Throughout the year, the steps serve as an impromptu theater, hosting fashion shows, concerts, and celebrations. The area surrounding the Spanish Steps has evolved into one of Rome\'s most fashionable shopping districts, with luxury boutiques lining the nearby streets, particularly Via Condotti, making it a destination for both culture and commerce. Recent restoration efforts have focused on preserving the steps for future generations. In 2015-2016, the monument underwent a comprehensive €1.5 million restoration sponsored by the jewelry house Bulgari, cleaning and repairing the travertine steps and strengthening their structural integrity. New regulations prohibit sitting on the steps and eating or drinking in the area, measures designed to protect this treasured monument from wear and damage. Despite these restrictions, the Spanish Steps remain one of Rome\'s most vibrant gathering places, where locals meet friends, tourists rest weary feet, and everyone pauses to admire the view and soak in the timeless beauty of this Baroque masterpiece that has graced the Roman landscape for three centuries.'
      },
      it: {
        name: 'Scalinata di Trinità dei Monti',
        narration: 'Benvenuti alla Scalinata di Trinità dei Monti, famosa come location del film "Vacanze Romane".',
        description: 'Una monumentale scalinata di 135 gradini',
        historicalInfo: 'La Scalinata di Trinità dei Monti è una serie di scalini a Roma, che sale un ripido pendio tra Piazza di Spagna alla base e Piazza Trinità dei Monti, dominata dalla chiesa della Trinità dei Monti in cima.',
        yearBuilt: '1723-1726',
        architect: 'Francesco de Sanctis e Alessandro Specchi'
      },
      ko: {
        name: '스페인 계단',
        narration: '영화 "로마의 휴일"의 촬영 장소로 유명한 스페인 계단에 오신 것을 환영합니다.',
        description: '135개의 계단으로 이루어진 기념비적인 계단',
        detailedDescription: '이탈리아어로 "Scalinata di Trinità dei Monti"로 알려진 스페인 계단은 로마에서 가장 사랑받고 사진이 많이 찍히는 랜드마크 중 하나로, 아래의 스페인 광장과 위의 트리니타 데이 몬티 교회 및 핀치아노 언덕을 우아하게 연결합니다. 12개의 계단층으로 나뉜 135개의 계단으로 구성된 이 기념비적인 바로크 계단은 3세기 동안 방문객들을 매료시킨 트라버틴 석재의 극적인 폭포를 만들어냅니다. 계단은 기단부의 스페인 광장에서 영어 이름을 따왔으며, 이 광장은 17세기부터 광장에 위치한 교황청 주재 스페인 대사관의 이름을 따서 명명되었습니다. 그러나 계단은 실제로 프랑스 외교에 의해 자금이 지원되어 오늘날까지 지속되는 재미있는 국제적 혼란을 만들어냈습니다. 스페인 계단의 역사는 17세기 초 스페인 광장과 위의 교회 사이의 가파른 경사면이 이동하기 어려웠던 때부터 시작됩니다. 수십 년에 걸쳐 이 두 중요한 장소를 연결하기에 적합한 웅장한 계단을 만들기 위한 다양한 제안이 제출되었습니다. 프랑스 군주제를 찬양하려는 프랑스와 종교적 권위를 강조하려는 교황청 사이의 의견 차이로 프로젝트는 수년간 지연되었습니다. 마침내 프랑스 외교관 에티엔 게피에가 유언장에 계단 건설을 위한 상당한 금액을 남겼지만, 교황 클레멘스 11세가 프로젝트를 승인하기까지 1717년까지 걸렸습니다. 디자인 경쟁은 알레산드로 스페키의 초기 스케치에서 영감을 받은 우아한 제안을 한 프란체스코 데 산크티스가 승리했습니다. 건설은 1723년에 시작되어 1725년에 완료되었습니다. 방문 팁: 봄에는 계단이 진달래 꽃으로 장식되어 더욱 아름답고, 이른 아침이나 늦은 저녁에 방문하면 군중을 피할 수 있으며, 계단에 앉아 먹거나 마시는 것은 금지되어 있으니 주의하세요.',
        historicalInfo: '스페인 계단은 로마에 있는 계단으로, 아래의 스페인 광장과 위의 트리니타 데이 몬티 광장 사이의 가파른 경사면을 오르며, 꼭대기에는 트리니타 데이 몬티 교회가 자리잡고 있습니다.',
        yearBuilt: '1723-1726년',
        architect: '프란체스코 데 산크티스와 알레산드로 스페키'
      },
      es: {
        name: 'Escalinata de la Plaza de España',
        narration: 'Bienvenido a la Escalinata de la Plaza de España, famosa como lugar de rodaje de la película "Vacaciones en Roma".',
        description: 'Una monumental escalinata de 135 escalones',
        detailedDescription: 'La Escalinata de la Plaza de España es una de las escaleras más famosas y románticas del mundo, conectando la Plaza de España con la iglesia de Trinità dei Monti. Construida entre 1723 y 1725 por Francesco de Sanctis. Los 135 escalones fueron financiados por el diplomático francés Étienne Gueffier. La escalinata ha aparecido en innumerables películas, incluyendo la icónica escena de Audrey Hepburn en Vacaciones en Roma.',
        historicalInfo: 'La Escalinata de la Plaza de España es un conjunto de escalones en Roma que sube una empinada pendiente entre la Piazza di Spagna en la base y la Piazza Trinità dei Monti, dominada por la iglesia de Trinità dei Monti en la cima.',
        yearBuilt: '1723-1726',
        architect: 'Francesco de Sanctis y Alessandro Specchi'
      },
      fr: {
        name: 'Escalier de la Trinité-des-Monts',
        narration: 'Bienvenue à l\'Escalier de la Trinité-des-Monts, célèbre comme lieu de tournage du film "Vacances Romaines".',
        description: 'Un escalier monumental de 135 marches',
        detailedDescription: 'L\'Escalier de la Trinité-des-Monts est l\'un des escaliers les plus célèbres et romantiques du monde, reliant la Place d\'Espagne à l\'église de la Trinité-des-Monts. Construit entre 1723 et 1725 par Francesco de Sanctis. Les 135 marches ont été financées par le diplomate français Étienne Gueffier. L\'escalier a été présenté dans d\'innombrables films, notamment la scène emblématique d\'Audrey Hepburn dans Vacances romaines.',
        historicalInfo: 'L\'Escalier de la Trinité-des-Monts est un ensemble de marches à Rome, gravissant une pente raide entre la Piazza di Spagna à la base et la Piazza Trinità dei Monti, dominée par l\'église de la Trinité-des-Monts au sommet.',
        yearBuilt: '1723-1726',
        architect: 'Francesco de Sanctis et Alessandro Specchi'
      },
      de: {
        name: 'Spanische Treppe',
        narration: 'Willkommen an der Spanischen Treppe, berühmt als Drehort des Films "Ein Herz und eine Krone".',
        description: 'Eine monumentale Treppe mit 135 Stufen',
        detailedDescription: 'Die Spanische Treppe ist eine der berühmtesten und romantischsten Treppen der Welt und verbindet die Piazza di Spagna mit der Kirche Trinità dei Monti. Zwischen 1723 und 1725 von Francesco de Sanctis erbaut. Die 135 Stufen wurden vom französischen Diplomaten Étienne Gueffier finanziert. Die Treppe wurde in unzähligen Filmen gezeigt, darunter die ikonische Szene mit Audrey Hepburn in Ein Herz und eine Krone.',
        historicalInfo: 'Die Spanische Treppe ist eine Treppe in Rom, die einen steilen Hang zwischen der Piazza di Spagna am Fuß und der Piazza Trinità dei Monti erklimmt, die von der Kirche Trinità dei Monti an der Spitze dominiert wird.',
        yearBuilt: '1723-1726',
        architect: 'Francesco de Sanctis und Alessandro Specchi'
      },
      zh: {
        name: '西班牙台阶',
        narration: '欢迎来到西班牙台阶，以电影《罗马假日》的拍摄地而闻名。',
        description: '由135级台阶组成的纪念性阶梯',
        detailedDescription: '西班牙台阶在意大利语中被称为"Scalinata di Trinità dei Monti"，是罗马最受喜爱和拍摄最多的地标之一，优雅地连接着底部的西班牙广场与上方的山上圣三一教堂和平丘山。这座纪念性的巴洛克式楼梯由135级台阶组成，分为12段，形成了三个世纪以来一直吸引游客的壮观的石灰华石梯级联。台阶的英文名称来自其底部的西班牙广场，而广场则以17世纪以来位于广场的圣座西班牙大使馆命名。然而，台阶实际上是由法国外交资助的，造成了一个延续至今的有趣的国际混乱。西班牙台阶的历史始于17世纪初，当时西班牙广场和上方教堂之间的陡坡难以通行。几十年来，人们提出了各种建议，以建造一个值得连接这两个重要地点的宏伟楼梯。由于希望颂扬法国君主制的法国和寻求强调宗教权威的教廷之间的分歧，该项目搁置了多年。最终，法国外交官艾蒂安·盖菲耶在遗嘱中遗赠了一笔可观的资金用于建造台阶，但直到1717年教皇克莱孟十一世才批准该项目。设计竞赛由弗朗切斯科·德·桑克蒂斯赢得，他的优雅提案从亚历山德罗·斯佩基的早期草图中汲取灵感。建设于1723年开始，1725年完成。游览提示：春季台阶装饰有杜鹃花，格外美丽；清晨或傍晚参观可避开人群；请注意禁止在台阶上坐着吃喝。',
        historicalInfo: '西班牙台阶是罗马的一组台阶，爬上西班牙广场和山上圣三一教堂广场之间的陡坡，顶部由山上圣三一教堂主导。',
        yearBuilt: '1723-1726年',
        architect: '弗朗切斯科·德·桑克蒂斯和亚历山德罗·斯佩基'
      },
      ja: {
        name: 'スペイン階段',
        narration: '映画「ローマの休日」の撮影場所として有名なスペイン階段へようこそ。',
        description: '135段からなる記念碑的な階段',
        detailedDescription: 'イタリア語で「Scalinata di Trinità dei Monti」として知られるスペイン階段は、ローマで最も愛され、最も写真に撮られるランドマークの一つで、麓のスペイン広場と上部のトリニタ・デイ・モンティ教会およびピンチョの丘を優雅に結んでいます。12の階段群に分かれた135段からなるこの記念碑的なバロック様式の階段は、3世紀にわたって訪問者を魅了してきたトラバーチン石の劇的な段差を作り出しています。階段は麓のスペイン広場から英語名を取っており、広場は17世紀以来そこに位置する教皇庁駐在スペイン大使館にちなんで名付けられました。しかし、階段は実際にはフランスの外交によって資金提供され、今日まで続く面白い国際的な混乱を生み出しました。スペイン階段の歴史は、スペイン広場と上の教会の間の急な坂が移動困難だった17世紀初頭に始まります。数十年にわたり、これら2つの重要な場所を結ぶにふさわしい壮大な階段を作るための様々な提案がなされました。フランス君主制を讃えたいフランスと宗教的権威を強調したい教皇庁との間の意見の相違により、プロジェクトは何年も停滞しました。最終的に、フランスの外交官エティエンヌ・ゲフィエが遺言で階段建設のための相当な金額を遺贈しましたが、教皇クレメンス11世がプロジェクトを承認するまで1717年までかかりました。デザインコンペティションはアレッサンドロ・スペッキの初期スケッチから着想を得た優雅な提案をしたフランチェスコ・デ・サンクティスが勝利しました。建設は1723年に始まり、1725年に完成しました。訪問のヒント：春には階段がツツジの花で飾られ特に美しく、早朝や夕方に訪れると混雑を避けられ、階段に座って食べたり飲んだりすることは禁止されているのでご注意ください。',
        historicalInfo: 'スペイン階段はローマにある階段で、麓のスペイン広場と山上のトリニタ・デイ・モンティ広場の間の急な坂を登り、頂上にはトリニタ・デイ・モンティ教会が建っています。',
        yearBuilt: '1723-1726年',
        architect: 'フランチェスコ・デ・サンクティスとアレッサンドロ・スペッキ'
      },
      pt: {
        name: 'Escadaria da Piazza di Spagna',
        narration: 'Bem-vindo à Escadaria da Piazza di Spagna, famosa como local de filmagem do filme "A Princesa e o Plebeu".',
        description: 'Uma escadaria monumental de 135 degraus',
        detailedDescription: 'A Escadaria da Piazza di Spagna é uma das escadarias mais famosas e românticas do mundo, conectando a Piazza di Spagna à igreja de Trinità dei Monti. Construída entre 1723 e 1725 por Francesco de Sanctis. Os 135 degraus foram financiados pelo diplomata francês Étienne Gueffier. A escadaria apareceu em inúmeros filmes, incluindo a icônica cena de Audrey Hepburn em A Princesa e o Plebeu.',
        historicalInfo: 'A Escadaria da Piazza di Spagna é um conjunto de degraus em Roma, subindo uma ladeira íngreme entre a Piazza di Spagna na base e a Piazza Trinità dei Monti, dominada pela igreja da Trinità dei Monti no topo.',
        yearBuilt: '1723-1726',
        architect: 'Francesco de Sanctis e Alessandro Specchi'
      },
      ru: {
        name: 'Испанская лестница',
        narration: 'Добро пожаловать на Испанскую лестницу, известную как место съемок фильма «Римские каникулы».',
        description: 'Монументальная лестница из 135 ступеней',
        detailedDescription: 'Испанская лестница является одной из самых знаменитых и романтичных лестниц в мире, соединяющей Площадь Испании с церковью Тринита-деи-Монти. Построена между 1723 и 1725 годами Франческо де Санктис. 135 ступеней были профинансированы французским дипломатом Этьеном Геффье. Лестница появлялась в бесчисленных фильмах, включая культовую сцену с Одри Хепберн в фильме Римские каникулы.',
        historicalInfo: 'Испанская лестница — это набор ступеней в Риме, поднимающихся по крутому склону между Пьяцца ди Спанья у подножия и Пьяцца Тринита деи Монти, на вершине которой доминирует церковь Тринита деи Монти.',
        yearBuilt: '1723-1726 гг.',
        architect: 'Франческо де Санктис и Алессандро Спекки'
      }
    }
  },
  {
    id: 'vatican_museums',
    cityId: 'rome',
    name: 'Vatican Museums',
    lat: 41.906487,
    lng: 12.453641,
    radius: 80,
    narration: 'Welcome to the Vatican Museums, one of the greatest art collections in the world. Founded by Pope Julius II in the 16th century, these museums display works from the immense collection amassed by the Catholic Church and the papacy throughout the centuries.',
    description: 'One of the largest and most impressive art museums in the world',
    category: 'Museum',
    detailedDescription: 'The Vatican Museums represent one of humanity\'s greatest treasure troves of art and history, housing an incomparable collection that spans over 5,000 years of human creativity. Located within Vatican City, the world\'s smallest independent state, these museums comprise 54 separate galleries containing approximately 70,000 works, of which 20,000 are on display. The museums attract over 6 million visitors annually, making them one of the most visited museum complexes in the world. The origins of the Vatican Museums date to 1506, when Pope Julius II purchased the ancient marble sculpture "Laocoön and His Sons," discovered in a Roman vineyard. This acquisition marked the beginning of what would become one of the world\'s most extraordinary art collections. Over the centuries, successive popes continued to expand the collection, commissioning new works and acquiring existing masterpieces, transforming the papal palaces into a vast repository of human artistic achievement. The museums\' most famous attraction is undoubtedly the Sistine Chapel, featuring Michelangelo\'s breathtaking ceiling frescoes (1508-1512) and his monumental "Last Judgment" (1536-1541) on the altar wall. The ceiling\'s iconic "Creation of Adam," with God\'s finger nearly touching Adam\'s, has become one of the most recognizable images in art history. Michelangelo painted the ceiling while lying on his back on scaffolding, a physically grueling task that took four years to complete and left him with permanent neck problems. The Raphael Rooms (Stanze di Raffaello) represent another highlight, featuring four rooms decorated with frescoes by Raphael and his students between 1508 and 1524. The "School of Athens" in the Stanza della Segnatura is particularly celebrated, depicting the greatest philosophers and scientists of antiquity in an idealized architectural setting. Raphael cleverly included portraits of his contemporaries: Plato bears the features of Leonardo da Vinci, while the brooding figure of Heraclitus is believed to be Michelangelo.',
    photos: [
      'https://images.unsplash.com/photo-1583424223556-bb53f4362c65?w=800',
      'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800',
      'https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=800'
    ],
    historicalInfo: 'The Vatican Museums originated from a sculpture collection begun by Pope Julius II in the 16th century and have grown to include works from the Renaissance masters and ancient civilizations.',
    yearBuilt: '1506',
    architect: 'Various popes and architects',
    translations: {
      en: {
        name: 'Vatican Museums',
        narration: 'Welcome to the Vatican Museums, one of the greatest art collections in the world. Founded by Pope Julius II in the 16th century, these museums display works from the immense collection amassed by the Catholic Church and the papacy throughout the centuries.',
        description: 'One of the largest and most impressive art museums in the world',
        detailedDescription: 'The Vatican Museums represent one of humanity\'s greatest treasure troves of art and history, housing an incomparable collection that spans over 5,000 years of human creativity. Located within Vatican City, the world\'s smallest independent state, these museums comprise 54 separate galleries containing approximately 70,000 works, of which 20,000 are on display. The museums attract over 6 million visitors annually, making them one of the most visited museum complexes in the world. The origins of the Vatican Museums date to 1506, when Pope Julius II purchased the ancient marble sculpture "Laocoön and His Sons," discovered in a Roman vineyard. This acquisition marked the beginning of what would become one of the world\'s most extraordinary art collections. Over the centuries, successive popes continued to expand the collection, commissioning new works and acquiring existing masterpieces, transforming the papal palaces into a vast repository of human artistic achievement. The museums\' most famous attraction is undoubtedly the Sistine Chapel, featuring Michelangelo\'s breathtaking ceiling frescoes (1508-1512) and his monumental "Last Judgment" (1536-1541) on the altar wall. The ceiling\'s iconic "Creation of Adam," with God\'s finger nearly touching Adam\'s, has become one of the most recognizable images in art history. Michelangelo painted the ceiling while lying on his back on scaffolding, a physically grueling task that took four years to complete and left him with permanent neck problems. The Raphael Rooms (Stanze di Raffaello) represent another highlight, featuring four rooms decorated with frescoes by Raphael and his students between 1508 and 1524. The "School of Athens" in the Stanza della Segnatura is particularly celebrated, depicting the greatest philosophers and scientists of antiquity in an idealized architectural setting. Raphael cleverly included portraits of his contemporaries: Plato bears the features of Leonardo da Vinci, while the brooding figure of Heraclitus is believed to be Michelangelo.',
        historicalInfo: 'The Vatican Museums originated from a sculpture collection begun by Pope Julius II in the 16th century and have grown to include works from the Renaissance masters and ancient civilizations.',
        yearBuilt: '1506',
        architect: 'Various popes and architects'
      },
      it: {
        name: 'Musei Vaticani',
        narration: 'Benvenuti ai Musei Vaticani, una delle più grandi collezioni d\'arte del mondo. Fondati da Papa Giulio II nel XVI secolo, questi musei espongono opere dell\'immensa collezione accumulata dalla Chiesa cattolica e dal papato nel corso dei secoli.',
        description: 'Uno dei musei d\'arte più grandi e impressionanti del mondo',
        detailedDescription: 'I Musei Vaticani rappresentano uno dei più grandi tesori d\'arte e storia dell\'umanità, ospitando una collezione incomparabile che abbraccia oltre 5.000 anni di creatività umana. Situati all\'interno della Città del Vaticano, lo stato indipendente più piccolo del mondo, questi musei comprendono 54 gallerie separate contenenti circa 70.000 opere, di cui 20.000 sono esposte. I musei attraggono oltre 6 milioni di visitatori all\'anno, rendendoli uno dei complessi museali più visitati al mondo. Le origini dei Musei Vaticani risalgono al 1506, quando Papa Giulio II acquistò l\'antica scultura in marmo "Laocoonte e i suoi figli," scoperta in un vigneto romano. Questa acquisizione segnò l\'inizio di quella che sarebbe diventata una delle collezioni d\'arte più straordinarie del mondo. Nei secoli, i successivi papi continuarono ad espandere la collezione, commissionando nuove opere e acquisendo capolavori esistenti, trasformando i palazzi papali in un vasto deposito del patrimonio artistico umano. L\'attrazione più famosa dei musei è indubbiamente la Cappella Sistina, con gli affreschi mozzafiato del soffitto di Michelangelo (1508-1512) e il suo monumentale "Giudizio Universale" (1536-1541) sulla parete dell\'altare. L\'iconica "Creazione di Adamo" del soffitto, con il dito di Dio che quasi tocca quello di Adamo, è diventata una delle immagini più riconoscibili nella storia dell\'arte. Michelangelo dipinse il soffitto sdraiato sulla schiena su un\'impalcatura, un compito fisicamente estenuante che richiese quattro anni per essere completato e gli lasciò problemi permanenti al collo. Le Stanze di Raffaello rappresentano un altro punto culminante, con quattro stanze decorate con affreschi di Raffaello e dei suoi studenti tra il 1508 e il 1524. "La Scuola di Atene" nella Stanza della Segnatura è particolarmente celebrata, raffigurando i più grandi filosofi e scienziati dell\'antichità in un ambiente architettonico idealizzato. Raffaello includeva astutamente ritratti dei suoi contemporanei: Platone porta le fattezze di Leonardo da Vinci, mentre la figura meditabonda di Eraclito si ritiene sia Michelangelo.',
        historicalInfo: 'I Musei Vaticani hanno origine da una collezione di sculture iniziata da Papa Giulio II nel XVI secolo e sono cresciuti fino a includere opere dei maestri del Rinascimento e delle civiltà antiche.',
        yearBuilt: '1506',
        architect: 'Vari papi e architetti'
      },
      ko: {
        name: '바티칸 박물관',
        narration: '세계에서 가장 위대한 미술 컬렉션 중 하나인 바티칸 박물관에 오신 것을 환영합니다. 16세기 교황 율리오 2세에 의해 설립된 이 박물관들은 수세기에 걸쳐 가톨릭 교회와 교황청이 수집한 방대한 컬렉션의 작품들을 전시하고 있습니다.',
        description: '세계에서 가장 크고 인상적인 미술관 중 하나',
        detailedDescription: '바티칸 박물관은 5,000년 이상의 인류 창의성을 아우르는 비할 데 없는 컬렉션을 보유한 인류 최고의 예술과 역사의 보고입니다. 세계에서 가장 작은 독립 국가인 바티칸 시국 내에 위치한 이 박물관은 약 70,000점의 작품을 보유한 54개의 개별 갤러리로 구성되어 있으며, 그 중 20,000점이 전시되어 있습니다. 박물관은 연간 600만 명 이상의 방문객을 끌어들이며 세계에서 가장 많이 방문하는 박물관 복합체 중 하나입니다. 바티칸 박물관의 기원은 1506년 교황 율리오 2세가 로마 포도밭에서 발견된 고대 대리석 조각 "라오콘과 그의 아들들"을 구입한 때로 거슬러 올라갑니다. 이 획득은 세계에서 가장 특별한 미술 컬렉션이 될 것의 시작을 알렸습니다. 수세기 동안 역대 교황들은 새로운 작품을 의뢰하고 기존 걸작을 수집하면서 컬렉션을 계속 확장하여 교황청 궁전을 인류 예술적 성취의 방대한 보고로 변모시켰습니다. 박물관의 가장 유명한 명소는 의심할 여지 없이 미켈란젤로의 숨막히는 천장 프레스코화(1508-1512)와 제단 벽의 기념비적인 "최후의 심판"(1536-1541)을 특징으로 하는 시스티나 성당입니다. 천장의 상징적인 "아담의 창조"는 하나님의 손가락이 아담의 손가락에 거의 닿는 모습으로 미술사에서 가장 잘 알려진 이미지 중 하나가 되었습니다. 미켈란젤로는 비계 위에 등을 대고 누워서 천장을 그렸는데, 이는 4년이 걸린 육체적으로 고된 작업이었고 그에게 영구적인 목 문제를 남겼습니다. 라파엘로의 방(Stanze di Raffaello)은 1508년과 1524년 사이에 라파엘로와 그의 제자들이 프레스코화로 장식한 4개의 방을 특징으로 하는 또 다른 하이라이트입니다. Stanza della Segnatura의 "아테네 학당"은 고대의 가장 위대한 철학자와 과학자들을 이상화된 건축 환경에 묘사한 것으로 특히 유명합니다. 라파엘로는 영리하게 동시대인들의 초상화를 포함시켰습니다: 플라톤은 레오나르도 다 빈치의 모습을 하고 있으며, 명상에 잠긴 헤라클레이토스의 모습은 미켈란젤로로 여겨집니다.',
        historicalInfo: '바티칸 박물관은 16세기 교황 율리오 2세가 시작한 조각 컬렉션에서 유래했으며, 르네상스 거장들과 고대 문명의 작품들을 포함하도록 성장했습니다.',
        yearBuilt: '1506년',
        architect: '다양한 교황과 건축가들'
      },
      es: {
        name: 'Museos Vaticanos',
        narration: 'Bienvenido a los Museos Vaticanos, una de las mayores colecciones de arte del mundo. Fundados por el Papa Julio II en el siglo XVI, estos museos exhiben obras de la inmensa colección acumulada por la Iglesia Católica y el papado a lo largo de los siglos.',
        description: 'Uno de los museos de arte más grandes e impresionantes del mundo',
        detailedDescription: 'Los Museos Vaticanos comprenden una de las colecciones de arte más grandes e importantes del mundo, albergadas en los palacios papales de la Ciudad del Vaticano. Fundados por el Papa Julio II, los museos incluyen aproximadamente 70.000 obras. El complejo incluye los famosos Aposentos de Rafael y culmina en la incomparable Capilla Sixtina, cuyo techo fue pintado por Miguel Ángel entre 1508 y 1512. Con más de seis millones de visitantes al año, es uno de los museos más visitados del mundo.',
        historicalInfo: 'Los Museos Vaticanos se originaron a partir de una colección de esculturas iniciada por el Papa Julio II en el siglo XVI y han crecido hasta incluir obras de los maestros del Renacimiento y civilizaciones antiguas.',
        yearBuilt: '1506',
        architect: 'Varios papas y arquitectos'
      },
      fr: {
        name: 'Musées du Vatican',
        narration: 'Bienvenue aux Musées du Vatican, l\'une des plus grandes collections d\'art au monde. Fondés par le pape Jules II au XVIe siècle, ces musées présentent des œuvres de l\'immense collection amassée par l\'Église catholique et la papauté au fil des siècles.',
        description: 'L\'un des plus grands et des plus impressionnants musées d\'art au monde',
        detailedDescription: 'Les Musées du Vatican comprennent l\'une des collections d\'art les plus grandes au monde. Fondés par le pape Jules II, les musées comptent environ 70 000 œuvres. Le complexe inclut les Chambres de Raphaël et la Chapelle Sixtine, peinte par Michel-Ange. C\'est l\'un des musées les plus visités au monde.',
        historicalInfo: 'Les Musées du Vatican sont issus d\'une collection de sculptures commencée par le pape Jules II au XVIe siècle et ont grandi pour inclure des œuvres des maîtres de la Renaissance et des civilisations anciennes.',
        yearBuilt: '1506',
        architect: 'Divers papes et architectes'
      },
      de: {
        name: 'Vatikanische Museen',
        narration: 'Willkommen in den Vatikanischen Museen, einer der größten Kunstsammlungen der Welt. Gegründet von Papst Julius II. im 16. Jahrhundert, zeigen diese Museen Werke aus der immensen Sammlung, die die katholische Kirche und das Papsttum über Jahrhunderte angesammelt haben.',
        description: 'Eines der größten und beeindruckendsten Kunstmuseen der Welt',
        detailedDescription: 'Die Vatikanischen Museen umfassen eine der größten und bedeutendsten Kunstsammlungen der Welt, untergebracht in den päpstlichen Palästen der Vatikanstadt. Gegründet von Papst Julius II., beherbergen die Museen etwa 70.000 Werke. Der Museumskomplex umfasst die berühmten Raffael-Stanzen und gipfelt in der unvergleichlichen Sixtinischen Kapelle, deren Decke von Michelangelo zwischen 1508 und 1512 bemalt wurde. Mit über sechs Millionen Besuchern pro Jahr ist es eines der meistbesuchten Museen der Welt.',
        historicalInfo: 'Die Vatikanischen Museen entstanden aus einer Skulpturensammlung, die Papst Julius II. im 16. Jahrhundert begann, und sind gewachsen, um Werke der Renaissance-Meister und antiker Zivilisationen einzuschließen.',
        yearBuilt: '1506',
        architect: 'Verschiedene Päpste und Architekten'
      },
      zh: {
        name: '梵蒂冈博物馆',
        narration: '欢迎来到梵蒂冈博物馆，世界上最伟大的艺术收藏之一。由教皇儒略二世于16世纪创立，这些博物馆展示了天主教会和教廷几个世纪以来积累的大量收藏品。',
        description: '世界上最大、最令人印象深刻的艺术博物馆之一',
        historicalInfo: '梵蒂冈博物馆起源于教皇儒略二世在16世纪开始的雕塑收藏，并已发展到包括文艺复兴大师和古代文明的作品。',
        yearBuilt: '1506年',
        architect: '多位教皇和建筑师'
      },
      ja: {
        name: 'バチカン美術館',
        narration: '世界最大級の美術コレクションの一つであるバチカン美術館へようこそ。16世紀に教皇ユリウス2世によって設立されたこれらの美術館は、カトリック教会と教皇庁が何世紀にもわたって収集した膨大なコレクションの作品を展示しています。',
        description: '世界で最も大きく印象的な美術館の一つ',
        historicalInfo: 'バチカン美術館は、16世紀に教皇ユリウス2世が始めた彫刻コレクションから始まり、ルネサンスの巨匠や古代文明の作品を含むまでに成長しました。',
        yearBuilt: '1506年',
        architect: '歴代の教皇と建築家たち'
      },
      pt: {
        name: 'Museus Vaticanos',
        narration: 'Bem-vindo aos Museus Vaticanos, uma das maiores coleções de arte do mundo. Fundados pelo Papa Júlio II no século XVI, estes museus exibem obras da imensa coleção acumulada pela Igreja Católica e pelo papado ao longo dos séculos.',
        description: 'Um dos maiores e mais impressionantes museus de arte do mundo',
        detailedDescription: 'Os Museus do Vaticano compreendem uma das maiores e mais importantes coleções de arte do mundo, abrigadas nos palácios papais da Cidade do Vaticano. Fundados pelo Papa Júlio II, os museus abrigam aproximadamente 70.000 obras. O complexo do museu inclui os famosos Aposentos de Rafael e culmina na incomparável Capela Sistina, cujo teto foi pintado por Michelangelo entre 1508 e 1512. Com mais de seis milhões de visitantes por ano, é um dos museus mais visitados do mundo.',
        historicalInfo: 'Os Museus Vaticanos originaram-se de uma coleção de esculturas iniciada pelo Papa Júlio II no século XVI e cresceram para incluir obras dos mestres do Renascimento e civilizações antigas.',
        yearBuilt: '1506',
        architect: 'Vários papas e arquitetos'
      },
      ru: {
        name: 'Музеи Ватикана',
        narration: 'Добро пожаловать в Музеи Ватикана, одну из величайших коллекций искусства в мире. Основанные папой Юлием II в XVI веке, эти музеи демонстрируют произведения из огромной коллекции, собранной Католической церковью и папством на протяжении веков.',
        description: 'Один из крупнейших и впечатляющих художественных музеев мира',
        detailedDescription: 'Музеи Ватикана представляют собой одну из крупнейших и важнейших коллекций произведений искусства в мире, размещенную в папских дворцах Ватикана. Основанные Папой Юлием II, музеи хранят около 70 000 произведений. Музейный комплекс включает знаменитые Станцы Рафаэля и завершается несравненной Сикстинской капеллой, потолок которой был расписан Микеланджело между 1508 и 1512 годами. С более чем шестью миллионами посетителей в год это один из самых посещаемых музеев мира.',
        historicalInfo: 'Музеи Ватикана возникли из коллекции скульптур, начатой папой Юлием II в XVI веке, и выросли до включения работ мастеров Возрождения и древних цивилизаций.',
        yearBuilt: '1506 г.',
        architect: 'Различные папы и архитекторы'
      }
    }
  },
  {
    id: 'st_peters_basilica',
    cityId: 'rome',
    name: 'St. Peter\'s Basilica',
    lat: 41.902168,
    lng: 12.453937,
    radius: 75,
    narration: 'Welcome to St. Peter\'s Basilica, the heart of the Catholic world and one of the largest churches ever built. This Renaissance masterpiece stands on the traditional site where Saint Peter, the first Pope, was crucified and buried.',
    description: 'The largest church in the world and center of Catholicism',
    category: 'Religious Site',
    detailedDescription: 'St. Peter\'s Basilica, known in Italian as "Basilica di San Pietro," stands as the spiritual and architectural heart of the Catholic Church and one of the most magnificent examples of Renaissance and Baroque architecture in the world. This massive church, covering 23,000 square meters (5.7 acres), can accommodate over 60,000 people and took more than 120 years to complete, involving some of history\'s greatest artists and architects including Bramante, Michelangelo, and Bernini. The current basilica, completed in 1626, was built on the site believed to be Saint Peter\'s tomb. According to tradition, Peter, one of Jesus\'s twelve apostles and the first Pope, was crucified upside down in Nero\'s Circus around 64 AD and buried nearby. The first church on this site, Old St. Peter\'s Basilica, was commissioned by Emperor Constantine in the 4th century. By the 15th century, the ancient basilica was in a state of disrepair, prompting Pope Julius II to commission its demolition and the construction of a new, grander structure. The basilica\'s iconic dome, designed by Michelangelo, dominates the Roman skyline and remains one of the largest domes in the world, measuring 42 meters in diameter and rising to a total height of 136 meters. Michelangelo took over the project in 1547 at age 72 and worked on it until his death in 1564, though he did not live to see the dome completed. The dome\'s interior features stunning mosaics and a Latin inscription from Matthew 16:18-19, where Jesus names Peter as the rock upon which the church will be built. Inside the basilica, visitors encounter an overwhelming display of artistic treasures. Michelangelo\'s Pietà (1498-1499), created when he was just 24 years old, shows the Virgin Mary cradling the dead body of Jesus with extraordinary tenderness and technical mastery. This is the only work Michelangelo ever signed, after overhearing visitors attribute it to another sculptor.',
    photos: [
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1583992876959-af90c2dcf744?w=800',
      'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=800'
    ],
    historicalInfo: 'St. Peter\'s Basilica was built between 1506 and 1626 on the traditional site of Saint Peter\'s tomb. It is regarded as one of the holiest Catholic shrines and has been described as holding a unique position in the Christian world.',
    yearBuilt: '1506-1626',
    architect: 'Bramante, Michelangelo, Bernini',
    translations: {
      en: {
        name: 'St. Peter\'s Basilica',
        narration: 'Welcome to St. Peter\'s Basilica, the heart of the Catholic world and one of the largest churches ever built. This Renaissance masterpiece stands on the traditional site where Saint Peter, the first Pope, was crucified and buried.',
        description: 'The largest church in the world and center of Catholicism',
        historicalInfo: 'St. Peter\'s Basilica was built between 1506 and 1626 on the traditional site of Saint Peter\'s tomb. It is regarded as one of the holiest Catholic shrines.',
        yearBuilt: '1506-1626',
        architect: 'Bramante, Michelangelo, Bernini'
      },
      it: {
        name: 'Basilica di San Pietro',
        narration: 'Benvenuti alla Basilica di San Pietro, il cuore del mondo cattolico e una delle chiese più grandi mai costruite. Questo capolavoro rinascimentale sorge sul sito tradizionale dove San Pietro, il primo Papa, fu crocifisso e sepolto.',
        description: 'La chiesa più grande del mondo e centro del cattolicesimo',
        historicalInfo: 'La Basilica di San Pietro fu costruita tra il 1506 e il 1626 sul sito tradizionale della tomba di San Pietro. È considerata uno dei santuari cattolici più sacri.',
        yearBuilt: '1506-1626',
        architect: 'Bramante, Michelangelo, Bernini'
      },
      ko: {
        name: '성 베드로 대성당',
        narration: '가톨릭 세계의 중심이자 역대 가장 큰 교회 중 하나인 성 베드로 대성당에 오신 것을 환영합니다. 이 르네상스 걸작은 첫 번째 교황인 성 베드로가 십자가에 못 박히고 묻힌 전통적인 장소에 세워져 있습니다.',
        description: '세계에서 가장 큰 교회이자 가톨릭의 중심지',
        historicalInfo: '성 베드로 대성당은 1506년부터 1626년 사이에 성 베드로의 무덤이 있는 전통적인 장소에 건설되었습니다. 가장 신성한 가톨릭 성지 중 하나로 여겨집니다.',
        yearBuilt: '1506-1626년',
        architect: '브라만테, 미켈란젤로, 베르니니'
      },
      es: {
        name: 'Basílica de San Pedro',
        narration: 'Bienvenido a la Basílica de San Pedro, el corazón del mundo católico y una de las iglesias más grandes jamás construidas. Esta obra maestra del Renacimiento se levanta en el lugar tradicional donde San Pedro, el primer Papa, fue crucificado y enterrado.',
        description: 'La iglesia más grande del mundo y centro del catolicismo',
        detailedDescription: 'La Basílica de San Pedro es la iglesia más grande del mundo y uno de los lugares más sagrados del cristianismo, construida sobre el sitio tradicional de la tumba del apóstol Pedro. Esta obra maestra del Renacimiento tardío y el Barroco fue diseñada principalmente por Donato Bramante, Miguel Ángel, Carlo Maderno y Gian Lorenzo Bernini, con la construcción extendiéndose desde 1506 hasta 1626. La fachada se eleva 45,5 metros de altura y su icónica cúpula, diseñada por Miguel Ángel, alcanza 136,6 metros. En el interior, la basílica alberga la Piedad de Miguel Ángel y el Baldaquino de Bernini. Como centro espiritual de la Iglesia Católica, atrae a millones de peregrinos y visitantes cada año.',
        historicalInfo: 'La Basílica de San Pedro fue construida entre 1506 y 1626 en el lugar tradicional de la tumba de San Pedro. Es considerada uno de los santuarios católicos más sagrados.',
        yearBuilt: '1506-1626',
        architect: 'Bramante, Miguel Ángel, Bernini'
      },
      fr: {
        name: 'Basilique Saint-Pierre',
        narration: 'Bienvenue à la Basilique Saint-Pierre, le cœur du monde catholique et l\'une des plus grandes églises jamais construites. Ce chef-d\'œuvre de la Renaissance s\'élève sur le site traditionnel où Saint Pierre, le premier pape, a été crucifié et enterré.',
        description: 'La plus grande église du monde et centre du catholicisme',
        detailedDescription: 'La Basilique Saint-Pierre est la plus grande église du monde et l\'un des lieux les plus sacrés du christianisme, construite sur le site traditionnel de la tombe de l\'apôtre Pierre. Ce chef-d\'œuvre de la Renaissance tardive et du Baroque a été principalement conçu par Donato Bramante, Michel-Ange, Carlo Maderno et Gian Lorenzo Bernini, avec une construction s\'étendant de 1506 à 1626. La façade s\'élève à 45,5 mètres de haut et son dôme emblématique, conçu par Michel-Ange, atteint 136,6 mètres. À l\'intérieur, la basilique abrite la Pietà de Michel-Ange et le Baldaquin de Bernini. En tant que centre spirituel de l\'Église catholique, elle attire des millions de pèlerins et de visiteurs chaque année.',
        historicalInfo: 'La Basilique Saint-Pierre a été construite entre 1506 et 1626 sur le site traditionnel du tombeau de Saint Pierre. Elle est considérée comme l\'un des sanctuaires catholiques les plus sacrés.',
        yearBuilt: '1506-1626',
        architect: 'Bramante, Michel-Ange, Le Bernin'
      },
      de: {
        name: 'Petersdom',
        narration: 'Willkommen im Petersdom, dem Herzen der katholischen Welt und einer der größten Kirchen, die je gebaut wurden. Dieses Renaissance-Meisterwerk steht an der traditionellen Stelle, wo der Heilige Petrus, der erste Papst, gekreuzigt und begraben wurde.',
        description: 'Die größte Kirche der Welt und Zentrum des Katholizismus',
        detailedDescription: 'Der Petersdom ist die größte Kirche der Welt und einer der heiligsten Orte des Christentums, erbaut über der traditionellen Grabstätte des Apostels Petrus. Dieses Meisterwerk der Spätrenaissance und des Barock wurde hauptsächlich von Donato Bramante, Michelangelo, Carlo Maderno und Gian Lorenzo Bernini entworfen, wobei sich der Bau von 1506 bis 1626 erstreckte. Die Fassade erhebt sich 45,5 Meter hoch und ihre ikonische Kuppel, entworfen von Michelangelo, erreicht 136,6 Meter. Im Inneren beherbergt die Basilika Michelangelos Pietà und Berninis Baldachin. Als spirituelles Zentrum der katholischen Kirche zieht sie jährlich Millionen von Pilgern und Besuchern an.',
        historicalInfo: 'Der Petersdom wurde zwischen 1506 und 1626 an der traditionellen Grabstätte des Heiligen Petrus erbaut. Er gilt als eines der heiligsten katholischen Heiligtümer.',
        yearBuilt: '1506-1626',
        architect: 'Bramante, Michelangelo, Bernini'
      },
      zh: {
        name: '圣彼得大教堂',
        narration: '欢迎来到圣彼得大教堂，天主教世界的中心，也是有史以来建造的最大教堂之一。这座文艺复兴杰作矗立在传统上圣彼得——第一任教皇——被钉十字架和埋葬的地方。',
        description: '世界上最大的教堂，天主教的中心',
        historicalInfo: '圣彼得大教堂于1506年至1626年间建造在圣彼得墓的传统地点上。它被视为最神圣的天主教圣殿之一。',
        yearBuilt: '1506-1626年',
        architect: '布拉曼特、米开朗基罗、贝尔尼尼'
      },
      ja: {
        name: 'サン・ピエトロ大聖堂',
        narration: 'カトリック世界の中心であり、史上最大の教会の一つであるサン・ピエトロ大聖堂へようこそ。このルネサンスの傑作は、初代教皇である聖ペトロが十字架にかけられ埋葬された伝統的な場所に建っています。',
        description: '世界最大の教会であり、カトリックの中心地',
        historicalInfo: 'サン・ピエトロ大聖堂は1506年から1626年にかけて聖ペトロの墓がある伝統的な場所に建設されました。最も神聖なカトリックの聖地の一つとされています。',
        yearBuilt: '1506-1626年',
        architect: 'ブラマンテ、ミケランジェロ、ベルニーニ'
      },
      pt: {
        name: 'Basílica de São Pedro',
        narration: 'Bem-vindo à Basílica de São Pedro, o coração do mundo católico e uma das maiores igrejas já construídas. Esta obra-prima do Renascimento ergue-se no local tradicional onde São Pedro, o primeiro Papa, foi crucificado e enterrado.',
        description: 'A maior igreja do mundo e centro do catolicismo',
        detailedDescription: 'A Basílica de São Pedro é a maior igreja do mundo e um dos lugares mais sagrados do cristianismo, construída sobre o local tradicional do túmulo do apóstolo Pedro. Esta obra-prima do Renascimento tardio e do Barroco foi projetada principalmente por Donato Bramante, Michelangelo, Carlo Maderno e Gian Lorenzo Bernini, com a construção estendendo-se de 1506 a 1626. A fachada ergue-se a 45,5 metros de altura e sua icônica cúpula, projetada por Michelangelo, atinge 136,6 metros. No interior, a basílica abriga a Pietà de Michelangelo e o Baldaquino de Bernini. Como centro espiritual da Igreja Católica, atrai milhões de peregrinos e visitantes a cada ano.',
        historicalInfo: 'A Basílica de São Pedro foi construída entre 1506 e 1626 no local tradicional do túmulo de São Pedro. É considerada um dos santuários católicos mais sagrados.',
        yearBuilt: '1506-1626',
        architect: 'Bramante, Michelangelo, Bernini'
      },
      ru: {
        name: 'Собор Святого Петра',
        narration: 'Добро пожаловать в Собор Святого Петра, сердце католического мира и одну из крупнейших церквей, когда-либо построенных. Этот шедевр эпохи Возрождения стоит на традиционном месте, где Святой Пётр, первый Папа, был распят и погребён.',
        description: 'Крупнейшая церковь в мире и центр католицизма',
        detailedDescription: 'Собор Святого Петра — крупнейшая церковь в мире и одно из самых священных мест христианства, построенная над традиционным местом захоронения апостола Петра. Этот шедевр позднего Возрождения и барокко был создан в основном Донато Браманте, Микеланджело, Карло Мадерно и Джан Лоренцо Бернини, а строительство продолжалось с 1506 по 1626 год. Фасад возвышается на 45,5 метра в высоту, а её культовый купол, спроектированный Микеланджело, достигает 136,6 метра. Внутри базилика хранит Пьету Микеланджело и балдахин Бернини. Как духовный центр Католической церкви, ежегодно привлекает миллионы паломников и посетителей.',
        historicalInfo: 'Собор Святого Петра был построен между 1506 и 1626 годами на традиционном месте гробницы Святого Петра. Он считается одной из самых священных католических святынь.',
        yearBuilt: '1506-1626 гг.',
        architect: 'Браманте, Микеланджело, Бернини'
      }
    }
  },
  {
    id: 'castel_santangelo',
    cityId: 'rome',
    name: 'Castel Sant\'Angelo',
    lat: 41.903065,
    lng: 12.466276,
    radius: 60,
    narration: 'Welcome to Castel Sant\'Angelo, the towering cylindrical fortress on the banks of the Tiber River. Originally built as a mausoleum for Emperor Hadrian, it has served as a papal fortress, prison, and now a museum.',
    description: 'Ancient mausoleum turned fortress and papal residence',
    category: 'Fortress',
    detailedDescription: 'Castel Sant\'Angelo, originally known as the Mausoleum of Hadrian, stands as one of Rome\'s most distinctive landmarks with its imposing cylindrical structure dominating the western bank of the Tiber River. This remarkable building has served many purposes over its 1,900-year history: imperial mausoleum, fortress, prison, and papal residence, each phase adding layers to its fascinating story. The castle was commissioned by Emperor Hadrian as a mausoleum for himself and his family around 123 AD and completed in 139 AD, one year after his death. The original structure consisted of a massive square base topped by a cylindrical drum, crowned with a garden and a golden quadriga (four-horse chariot) statue of Hadrian. The emperor\'s ashes were placed in a golden urn in the central chamber, and subsequent emperors up to Caracalla (217 AD) were also interred here. The monument\'s transformation into a military fortress began in 403 AD when Emperor Honorius incorporated it into the Aurelian Walls. Its strategic location made it an ideal defensive position, and it was successfully used to repel various barbarian invasions. The building acquired its current name in 590 AD, according to legend, when Pope Gregory the Great, leading a procession to pray for the end of a plague, had a vision of Archangel Michael atop the mausoleum sheathing his sword, signaling the end of the epidemic. A statue of the angel was subsequently placed on top of the building. During the medieval period, the castle became a papal fortress and was connected to Vatican City by a fortified corridor called the Passetto di Borgo, built in 1277. This secret passage allowed popes to flee to the safety of the castle during times of danger. Pope Clement VII famously used this escape route during the Sack of Rome in 1527, when troops of the Holy Roman Emperor besieged the city.',
    photos: [
      'https://images.unsplash.com/photo-1544508618-f6927bc85146?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800'
    ],
    historicalInfo: 'Originally commissioned by Emperor Hadrian as a mausoleum, Castel Sant\'Angelo has served as a fortress, prison, and papal residence throughout its history. The castle was named after Archangel Michael following a legendary vision in 590 AD.',
    yearBuilt: '123-139 AD',
    architect: 'Emperor Hadrian',
    translations: {
      en: {
        name: 'Castel Sant\'Angelo',
        narration: 'Welcome to Castel Sant\'Angelo, the towering cylindrical fortress on the banks of the Tiber River. Originally built as a mausoleum for Emperor Hadrian, it has served as a papal fortress, prison, and now a museum.',
        description: 'Ancient mausoleum turned fortress and papal residence',
        historicalInfo: 'Originally commissioned by Emperor Hadrian as a mausoleum, it has served as a fortress, prison, and papal residence. Named after Archangel Michael following a legendary vision in 590 AD.',
        yearBuilt: '123-139 AD',
        architect: 'Emperor Hadrian'
      },
      it: {
        name: 'Castel Sant\'Angelo',
        narration: 'Benvenuti a Castel Sant\'Angelo, l\'imponente fortezza cilindrica sulle rive del Tevere. Originariamente costruito come mausoleo per l\'imperatore Adriano, ha servito come fortezza papale, prigione e ora museo.',
        description: 'Antico mausoleo trasformato in fortezza e residenza papale',
        historicalInfo: 'Originariamente commissionato dall\'imperatore Adriano come mausoleo, ha servito come fortezza, prigione e residenza papale. Prende il nome dall\'Arcangelo Michele a seguito di una visione leggendaria nel 590 d.C.',
        yearBuilt: '123-139 d.C.',
        architect: 'Imperatore Adriano'
      },
      ko: {
        name: '산탄젤로 성',
        narration: '티베르 강변에 우뚝 솟은 원형 요새 산탄젤로 성에 오신 것을 환영합니다. 원래 하드리아누스 황제의 영묘로 건설되었으며, 교황의 요새, 감옥, 그리고 현재는 박물관으로 사용되어 왔습니다.',
        description: '고대 영묘에서 요새와 교황 거주지로 변모한 건축물',
        historicalInfo: '원래 하드리아누스 황제가 영묘로 의뢰했으며, 요새, 감옥, 교황 거주지로 사용되었습니다. 590년 전설적인 환상 이후 대천사 미카엘의 이름을 따서 명명되었습니다.',
        yearBuilt: '123-139년',
        architect: '하드리아누스 황제'
      },
      es: {
        name: 'Castillo de Sant\'Angelo',
        narration: 'Bienvenido al Castillo de Sant\'Angelo, la imponente fortaleza cilíndrica a orillas del río Tíber. Originalmente construido como mausoleo para el emperador Adriano, ha servido como fortaleza papal, prisión y ahora museo.',
        description: 'Antiguo mausoleo convertido en fortaleza y residencia papal',
        historicalInfo: 'Originalmente encargado por el emperador Adriano como mausoleo, ha servido como fortaleza, prisión y residencia papal. Recibe su nombre del Arcángel Miguel tras una visión legendaria en el año 590 d.C.',
        detailedDescription: 'Castel Sant\'Angelo fue construido como mausoleo para el emperador Adriano. Ha servido como fortaleza, prisión, residencia papal y ahora museo. Su nombre proviene de una leyenda del año 590, cuando el Papa Gregorio I vio al arcángel Miguel. Los visitantes pueden subir a la terraza con vistas panorámicas de Roma.',
        yearBuilt: '123-139 d.C.',
        architect: 'Emperador Adriano'
      },
      fr: {
        name: 'Château Saint-Ange',
        narration: 'Bienvenue au Château Saint-Ange, l\'imposante forteresse cylindrique sur les rives du Tibre. Construit à l\'origine comme mausolée pour l\'empereur Hadrien, il a servi de forteresse papale, de prison et maintenant de musée.',
        description: 'Ancien mausolée transformé en forteresse et résidence papale',
        detailedDescription: 'Le Château Saint-Ange, construit à l\'origine comme mausolée pour l\'empereur Hadrien et sa famille, a servi de nombreux objectifs au cours de près de deux millénaires d\'histoire, notamment comme forteresse, prison, résidence papale et maintenant musée. La structure cylindrique a été commandée en 123 après J.-C. Son nom provient d\'une légende de l\'an 590, lorsque le pape Grégoire Ier aurait vu l\'archange Michel rengainant son épée. Les visiteurs peuvent monter sur la terrasse couronnée d\'une statue en bronze de l\'archange Michel offrant des vues panoramiques sur Rome.',
        historicalInfo: 'Commandé à l\'origine par l\'empereur Hadrien comme mausolée, il a servi de forteresse, de prison et de résidence papale. Il porte le nom de l\'Archange Michel suite à une vision légendaire en 590 après J.-C.',
        yearBuilt: '123-139 apr. J.-C.',
        architect: 'Empereur Hadrien'
      },
      de: {
        name: 'Engelsburg',
        narration: 'Willkommen in der Engelsburg, der imposanten zylindrischen Festung am Ufer des Tibers. Ursprünglich als Mausoleum für Kaiser Hadrian erbaut, diente sie als päpstliche Festung, Gefängnis und heute als Museum.',
        description: 'Antikes Mausoleum, umgewandelt in Festung und päpstliche Residenz',
        detailedDescription: 'Die Engelsburg, ursprünglich als Mausoleum für Kaiser Hadrian und seine Familie erbaut, hat im Laufe von fast zweitausend Jahren Geschichte zahlreichen Zwecken gedient, darunter als Festung, Gefängnis, päpstliche Residenz und heute als Museum. Die zylindrische Struktur wurde 123 n. Chr. in Auftrag gegeben. Ihr Name stammt aus einer Legende aus dem Jahr 590, als Papst Gregor I. den Erzengel Michael sah, der sein Schwert einsteckte. Besucher können zur Terrasse aufsteigen, die von einer Bronzestatue des Erzengels Michael gekrönt wird und Panoramablicke auf Rom bietet.',
        historicalInfo: 'Ursprünglich von Kaiser Hadrian als Mausoleum in Auftrag gegeben, diente es als Festung, Gefängnis und päpstliche Residenz. Benannt nach dem Erzengel Michael nach einer legendären Vision im Jahr 590 n. Chr.',
        yearBuilt: '123-139 n. Chr.',
        architect: 'Kaiser Hadrian'
      },
      zh: {
        name: '圣天使城堡',
        narration: '欢迎来到圣天使城堡，这座雄伟的圆柱形堡垒矗立在台伯河畔。最初作为哈德良皇帝的陵墓建造，后来曾作为教皇堡垒、监狱，现在是一座博物馆。',
        description: '从古代陵墓转变为堡垒和教皇居所',
        historicalInfo: '最初由哈德良皇帝委托建造作为陵墓，后来曾作为堡垒、监狱和教皇居所。590年传说中的异象后以大天使米迦勒命名。',
        yearBuilt: '公元123-139年',
        architect: '哈德良皇帝'
      },
      ja: {
        name: 'サンタンジェロ城',
        narration: 'テベレ川のほとりにそびえ立つ円筒形の要塞、サンタンジェロ城へようこそ。もともとハドリアヌス帝の霊廟として建設され、教皇の要塞、牢獄、そして現在は博物館として使用されてきました。',
        description: '古代の霊廟から要塞と教皇の居所に変貌した建築物',
        historicalInfo: 'もともとハドリアヌス帝が霊廟として建設を依頼し、要塞、牢獄、教皇の居所として使用されました。590年の伝説的な幻視の後、大天使ミカエルにちなんで命名されました。',
        yearBuilt: '123-139年',
        architect: 'ハドリアヌス帝'
      },
      pt: {
        name: 'Castelo de Sant\'Angelo',
        narration: 'Bem-vindo ao Castelo de Sant\'Angelo, a imponente fortaleza cilíndrica às margens do rio Tibre. Originalmente construído como mausoléu para o imperador Adriano, serviu como fortaleza papal, prisão e agora museu.',
        description: 'Antigo mausoléu transformado em fortaleza e residência papal',
        historicalInfo: 'Originalmente encomendado pelo imperador Adriano como mausoléu, serviu como fortaleza, prisão e residência papal. Recebeu o nome do Arcanjo Miguel após uma visão lendária em 590 d.C.',
        detailedDescription: 'O Castelo de Sant\'Angelo foi construído como mausoléu para o imperador Adriano. Serviu como fortaleza, prisão, residência papal e agora museu. Seu nome vem de uma lenda do ano 590, quando o Papa Gregório I viu o arcanjo Miguel. Os visitantes podem subir ao terraço com vistas panorâmicas de Roma.',
        yearBuilt: '123-139 d.C.',
        architect: 'Imperador Adriano'
      },
      ru: {
        name: 'Замок Святого Ангела',
        narration: 'Добро пожаловать в Замок Святого Ангела, величественную цилиндрическую крепость на берегу реки Тибр. Первоначально построенный как мавзолей императора Адриана, он служил папской крепостью, тюрьмой, а теперь музеем.',
        description: 'Древний мавзолей, превращённый в крепость и папскую резиденцию',
        detailedDescription: 'Замок Святого Ангела, первоначально построенный как мавзолей для императора Адриана, служил многочисленным целям включая крепость, тюрьму, папскую резиденцию и теперь музей. Цилиндрическое сооружение было заказано в 123 году н.э. Его название происходит от легенды 590 года, когда Папа Григорий I увидел архангела Михаила, вкладывающего меч в ножны. Посетители могут подняться на террасу с панорамными видами на Рим.',
        historicalInfo: 'Первоначально заказанный императором Адрианом как мавзолей, он служил крепостью, тюрьмой и папской резиденцией. Назван в честь Архангела Михаила после легендарного видения в 590 году н.э.',
        yearBuilt: '123-139 гг. н.э.',
        architect: 'Император Адриан'
      }
    }
  },
  // Paris landmarks
  {
    id: 'eiffel_tower',
    cityId: 'paris',
    name: 'Eiffel Tower',
    lat: 48.858093,
    lng: 2.294694,
    radius: 70,
    narration: 'Welcome to the Eiffel Tower, the iron lady of Paris. Built for the 1889 World\'s Fair, it has become the global icon of France.',
    description: 'The most-visited paid monument in the world',
    category: 'Monument',
    detailedDescription: 'The Eiffel Tower, or "La Tour Eiffel," stands as the undisputed symbol of Paris and France, an iron lattice masterpiece that has captivated the world since its completion in 1889. Rising 330 meters (1,083 feet) into the Parisian sky, this architectural marvel was initially conceived as a temporary structure for the 1889 Exposition Universelle (World\'s Fair), celebrating the centennial of the French Revolution. Today, it welcomes nearly seven million visitors annually, making it the most-visited paid monument in the world. The tower was designed by engineer Gustave Eiffel, whose company specialized in metal framework construction. Eiffel\'s design was selected from over 100 submissions in a competition to create a centerpiece for the World\'s Fair. The structure\'s innovative design and unprecedented height sparked intense controversy among Parisian artists and intellectuals, who published a petition called "Artists Against the Eiffel Tower," denouncing it as a monstrous iron monstrosity that would disfigure the elegant Parisian skyline. Notable critics included author Guy de Maupassant, who reportedly ate lunch in the tower\'s restaurant every day because it was the one place in Paris where he couldn\'t see the tower. Construction began in January 1887 and was completed in a remarkable 2 years, 2 months, and 5 days, a testament to Eiffel\'s engineering prowess and organizational skills. The tower required 18,038 metallic parts, 2.5 million rivets, and over 300 workers to assemble. Despite the enormous scale of the project and the height at which much of the work was performed, only one worker died during construction - a remarkably low casualty rate for the era. The tower\'s lattice structure was revolutionary, using an open-frame design that minimized wind resistance while maximizing strength. The four massive curved legs rest on concrete foundations, each supported by four separate foundation blocks. The legs converge as they rise, meeting at the first platform at 57 meters (187 feet). Above this, the structure continues upward through a second platform at 115 meters (377 feet) before tapering to the summit at 300 meters, with antennas extending the total height to 330 meters. The tower was painted a distinctive reddish-brown color for the exposition, but has since been repainted 18 times, with the current "Eiffel Tower Brown" requiring 60 tons of paint applied in three different shades - darker at the bottom and lighter at the top to enhance its appearance against the sky. Originally intended to stand for only 20 years, the Eiffel Tower was saved from demolition when Eiffel shrewdly emphasized its value as a radiotelegraphy station. The tower proved invaluable during World War I for intercepting enemy communications, and later became essential for radio and television broadcasting. During World War II, when Hitler visited Paris in 1940, French resistance fighters cut the elevator cables, forcing the Führer to climb the stairs if he wanted to reach the summit - he declined. The tower has served as the site of numerous scientific experiments, including Eiffel\'s own aerodynamic and meteorological studies. Physicist Théodore Wulf conducted radiation experiments from the top in 1910, leading to the discovery of cosmic rays. The tower has also witnessed remarkable feats of daring: in 1912, Austrian tailor Franz Reichelt jumped from the first platform wearing a parachute suit of his own design - tragically, it failed. In 1923, journalist Pierre Labric rode a bicycle down the stairs from the first level. The tower\'s three platforms offer spectacular views of Paris and host restaurants, museums, and shops. The first platform, recently renovated, features a glass floor offering a thrilling view straight down. The second platform houses the Michelin-starred restaurant Jules Verne, offering gourmet dining with unparalleled views. The summit, accessible by elevator, provides a breathtaking 360-degree panorama of the City of Light. The tower has been featured in countless films, artworks, and photographs, becoming synonymous with romance, elegance, and French culture. It serves as the backdrop for millions of proposals, weddings, and celebrations each year. Every evening, the tower sparkles for five minutes at the beginning of each hour after sunset, illuminated by 20,000 light bulbs installed in 1985, creating a magical spectacle visible throughout Paris. Recent additions include wind turbines and solar panels, making the iconic structure more environmentally sustainable while maintaining its historic character. The tower also hosts various exhibitions and events, from art installations to sporting events, continually reinventing itself while remaining true to Eiffel\'s original vision. Today, the Eiffel Tower stands not just as an engineering achievement but as a testament to human creativity, ambition, and the power of vision to overcome criticism and create something truly timeless. What was once derided as an eyesore has become the most recognizable landmark on Earth, proving that great art and engineering can transform not just skylines, but hearts and minds across generations.',
    photos: [
      'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
      'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800',
      'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800'
    ],
    historicalInfo: 'The Eiffel Tower was built for the 1889 World\'s Fair and was initially criticized by some of France\'s leading artists and intellectuals. It has become a global cultural icon of France.',
    yearBuilt: '1887-1889',
    architect: 'Gustave Eiffel',
    translations: {
      en: {
        name: 'Eiffel Tower',
        narration: 'Welcome to the Eiffel Tower, the iron lady of Paris. Built for the 1889 World\'s Fair, it has become the global icon of France.',
        description: 'The most-visited paid monument in the world',
        detailedDescription: 'The Eiffel Tower, or "La Tour Eiffel," stands as the undisputed symbol of Paris and France, an iron lattice masterpiece that has captivated the world since its completion in 1889. Rising 330 meters (1,083 feet) into the Parisian sky, this architectural marvel was initially conceived as a temporary structure for the 1889 Exposition Universelle (World\'s Fair), celebrating the centennial of the French Revolution. Today, it welcomes nearly seven million visitors annually, making it the most-visited paid monument in the world. The tower was designed by engineer Gustave Eiffel, whose company specialized in metal framework construction. Eiffel\'s design was selected from over 100 submissions in a competition to create a centerpiece for the World\'s Fair. The structure\'s innovative design and unprecedented height sparked intense controversy among Parisian artists and intellectuals, who published a petition called "Artists Against the Eiffel Tower," denouncing it as a monstrous iron monstrosity that would disfigure the elegant Parisian skyline. Notable critics included author Guy de Maupassant, who reportedly ate lunch in the tower\'s restaurant every day because it was the one place in Paris where he couldn\'t see the tower. Construction began in January 1887 and was completed in a remarkable 2 years, 2 months, and 5 days, a testament to Eiffel\'s engineering prowess and organizational skills. The tower required 18,038 metallic parts, 2.5 million rivets, and over 300 workers to assemble. Despite the enormous scale of the project and the height at which much of the work was performed, only one worker died during construction - a remarkably low casualty rate for the era. The tower\'s lattice structure was revolutionary, using an open-frame design that minimized wind resistance while maximizing strength. The four massive curved legs rest on concrete foundations, each supported by four separate foundation blocks. The legs converge as they rise, meeting at the first platform at 57 meters (187 feet). Above this, the structure continues upward through a second platform at 115 meters (377 feet) before tapering to the summit at 300 meters, with antennas extending the total height to 330 meters. The tower was painted a distinctive reddish-brown color for the exposition, but has since been repainted 18 times, with the current "Eiffel Tower Brown" requiring 60 tons of paint applied in three different shades - darker at the bottom and lighter at the top to enhance its appearance against the sky. Originally intended to stand for only 20 years, the Eiffel Tower was saved from demolition when Eiffel shrewdly emphasized its value as a radiotelegraphy station. The tower proved invaluable during World War I for intercepting enemy communications, and later became essential for radio and television broadcasting. During World War II, when Hitler visited Paris in 1940, French resistance fighters cut the elevator cables, forcing the Führer to climb the stairs if he wanted to reach the summit - he declined. The tower has served as the site of numerous scientific experiments, including Eiffel\'s own aerodynamic and meteorological studies. Physicist Théodore Wulf conducted radiation experiments from the top in 1910, leading to the discovery of cosmic rays. The tower has also witnessed remarkable feats of daring: in 1912, Austrian tailor Franz Reichelt jumped from the first platform wearing a parachute suit of his own design - tragically, it failed. In 1923, journalist Pierre Labric rode a bicycle down the stairs from the first level. The tower\'s three platforms offer spectacular views of Paris and host restaurants, museums, and shops. The first platform, recently renovated, features a glass floor offering a thrilling view straight down. The second platform houses the Michelin-starred restaurant Jules Verne, offering gourmet dining with unparalleled views. The summit, accessible by elevator, provides a breathtaking 360-degree panorama of the City of Light. The tower has been featured in countless films, artworks, and photographs, becoming synonymous with romance, elegance, and French culture. It serves as the backdrop for millions of proposals, weddings, and celebrations each year. Every evening, the tower sparkles for five minutes at the beginning of each hour after sunset, illuminated by 20,000 light bulbs installed in 1985, creating a magical spectacle visible throughout Paris. Recent additions include wind turbines and solar panels, making the iconic structure more environmentally sustainable while maintaining its historic character. The tower also hosts various exhibitions and events, from art installations to sporting events, continually reinventing itself while remaining true to Eiffel\'s original vision. Today, the Eiffel Tower stands not just as an engineering achievement but as a testament to human creativity, ambition, and the power of vision to overcome criticism and create something truly timeless. What was once derided as an eyesore has become the most recognizable landmark on Earth, proving that great art and engineering can transform not just skylines, but hearts and minds across generations.'
      },
      it: {
        name: 'Torre Eiffel',
        narration: 'Benvenuto alla Torre Eiffel, la dama di ferro di Parigi. Costruita per l\'Esposizione Universale del 1889, è diventata l\'icona globale della Francia.',
        description: 'Il monumento a pagamento più visitato al mondo',
        historicalInfo: 'La Torre Eiffel fu costruita per l\'Esposizione Universale del 1889 e inizialmente fu criticata da alcuni dei principali artisti e intellettuali francesi. È diventata un\'icona culturale globale della Francia.',
        yearBuilt: '1887-1889',
        architect: 'Gustave Eiffel'
      },
      ko: {
        name: '에펠탑',
        narration: '파리의 철의 여인, 에펠탑에 오신 것을 환영합니다. 1889년 만국박람회를 위해 건설되어 프랑스의 세계적인 상징이 되었습니다.',
        description: '세계에서 가장 많이 방문하는 유료 기념물',
        detailedDescription: '"라 투르 에펠"이라고도 불리는 에펠탑은 파리와 프랑스의 확실한 상징으로, 1889년 완공 이후 세계를 매료시켜온 철제 격자 구조의 걸작입니다. 파리 하늘 위로 330미터(1,083피트) 높이로 솟아있는 이 건축적 경이는 프랑스 혁명 100주년을 기념하는 1889년 만국박람회를 위한 임시 구조물로 처음 구상되었습니다. 오늘날 매년 거의 700만 명의 방문객을 맞이하며 세계에서 가장 많이 방문하는 유료 기념물이 되었습니다. 탑은 금속 골조 건설을 전문으로 하는 기술자 귀스타브 에펠이 설계했습니다. 에펠의 디자인은 만국박람회의 중심물을 만들기 위한 경쟁에서 100개 이상의 제출작 중에서 선정되었습니다. 구조물의 혁신적인 디자인과 전례 없는 높이는 파리 예술가와 지식인들 사이에서 격렬한 논란을 일으켰으며, 그들은 "에펠탑에 반대하는 예술가들"이라는 청원서를 발표하여 우아한 파리 스카이라인을 훼손할 괴물 같은 철제 괴물이라고 비난했습니다. 건설은 1887년 1월에 시작되어 놀랍게도 2년 2개월 5일 만에 완료되었으며, 이는 에펠의 공학적 능력과 조직 기술을 증명합니다. 탑은 18,038개의 금속 부품, 250만 개의 리벳, 300명 이상의 노동자가 필요했습니다. 작업이 수행된 높이와 프로젝트의 엄청난 규모에도 불구하고 건설 중 단 한 명의 노동자만 사망했습니다. 방문 팁: 일몰 시간에 방문하면 파리의 황금빛 풍경과 밤의 반짝이는 조명쇼를 모두 즐길 수 있으며, 티켓은 온라인으로 미리 예약하는 것이 좋고, 2층까지는 계단으로 올라가면 더 저렴하고 군중을 피할 수 있습니다.',
        historicalInfo: '에펠탑은 1889년 만국박람회를 위해 건설되었으며 처음에는 프랑스의 주요 예술가와 지식인들로부터 비판을 받았습니다. 프랑스의 세계적인 문화 아이콘이 되었습니다.',
        yearBuilt: '1887-1889년',
        architect: '귀스타브 에펠'
      },
      es: {
        name: 'Torre Eiffel',
        narration: 'Bienvenido a la Torre Eiffel, la dama de hierro de París. Construida para la Exposición Universal de 1889, se ha convertido en el icono global de Francia.',
        description: 'El monumento de pago más visitado del mundo',
        historicalInfo: 'La Torre Eiffel fue construida para la Exposición Universal de 1889 y fue inicialmente criticada por algunos de los principales artistas e intelectuales de Francia. Se ha convertido en un icono cultural global de Francia.',
        yearBuilt: '1887-1889',
        architect: 'Gustave Eiffel'
      },
      fr: {
        name: 'Tour Eiffel',
        narration: 'Bienvenue à la Tour Eiffel, la dame de fer de Paris. Construite pour l\'Exposition Universelle de 1889, elle est devenue l\'icône mondiale de la France.',
        description: 'Le monument payant le plus visité au monde',
        historicalInfo: 'La Tour Eiffel a été construite pour l\'Exposition Universelle de 1889 et a été initialement critiquée par certains des principaux artistes et intellectuels français. Elle est devenue une icône culturelle mondiale de la France.',
        yearBuilt: '1887-1889',
        architect: 'Gustave Eiffel'
      },
      de: {
        name: 'Eiffelturm',
        narration: 'Willkommen am Eiffelturm, der eisernen Dame von Paris. Erbaut für die Weltausstellung 1889, ist er zum globalen Symbol Frankreichs geworden.',
        description: 'Das meistbesuchte kostenpflichtige Monument der Welt',
        historicalInfo: 'Der Eiffelturm wurde für die Weltausstellung 1889 gebaut und wurde anfangs von einigen führenden französischen Künstlern und Intellektuellen kritisiert. Er ist zu einer globalen kulturellen Ikone Frankreichs geworden.',
        yearBuilt: '1887-1889',
        architect: 'Gustave Eiffel'
      },
      zh: {
        name: '埃菲尔铁塔',
        narration: '欢迎来到埃菲尔铁塔，巴黎的钢铁女士。为1889年世界博览会建造，已成为法国的全球象征。',
        description: '世界上访问量最多的收费纪念碑',
        detailedDescription: '埃菲尔铁塔，或称"La Tour Eiffel"，是巴黎和法国无可争议的象征，自1889年完工以来一直吸引着世界的铁格子杰作。这座建筑奇迹高耸入巴黎天空330米（1,083英尺），最初是为庆祝法国大革命一百周年的1889年世界博览会而设计的临时建筑。如今，它每年接待近700万游客，成为世界上访问量最多的收费纪念碑。铁塔由专门从事金属框架建设的工程师古斯塔夫·埃菲尔设计。埃菲尔的设计从100多份提交作品中脱颖而出，赢得了为世界博览会创建标志性建筑的竞赛。这座建筑的创新设计和前所未有的高度在巴黎艺术家和知识分子中引发了激烈争议，他们发表了一份名为"反对埃菲尔铁塔的艺术家"的请愿书，谴责它是一个会破坏优雅巴黎天际线的怪异铁怪物。值得注意的批评者包括作家莫泊桑，据说他每天都在塔的餐厅吃午餐，因为那是巴黎唯一一个看不到铁塔的地方。建设于1887年1月开始，并在令人瞩目的2年2个月零5天内完成，这证明了埃菲尔的工程能力和组织技能。铁塔需要18,038个金属部件、250万个铆钉和300多名工人组装。尽管项目规模巨大，工作高度也很高，但施工期间只有一名工人死亡——这在当时是一个非常低的伤亡率。游览提示：日落时分参观可以欣赏巴黎的金色景观和夜晚的闪烁灯光秀，建议提前在线预订门票，步行上二层更便宜且可以避开人群。',
        historicalInfo: '埃菲尔铁塔为1889年世界博览会而建，最初受到一些法国主要艺术家和知识分子的批评。它已成为法国的全球文化象征。',
        yearBuilt: '1887-1889年',
        architect: '古斯塔夫·埃菲尔'
      },
      ja: {
        name: 'エッフェル塔',
        narration: 'パリの鉄の貴婦人、エッフェル塔へようこそ。1889年の万国博覧会のために建設され、フランスの世界的象徴となりました。',
        description: '世界で最も訪問者の多い有料モニュメント',
        detailedDescription: 'エッフェル塔、または「ラ・トゥール・エッフェル」は、パリとフランスの揺るぎない象徴として、1889年の完成以来世界を魅了してきた鉄格子の傑作です。パリの空に330メートル（1,083フィート）の高さでそびえ立つこの建築の驚異は、フランス革命100周年を祝う1889年の万国博覧会のための一時的な構造物として当初考案されました。今日では毎年約700万人の訪問者を迎え、世界で最も訪問者の多い有料モニュメントとなっています。塔は金属骨組み建設を専門とする技術者ギュスターヴ・エッフェルによって設計されました。エッフェルのデザインは、万国博覧会の目玉を作るための競争で100以上の提出作品から選ばれました。構造物の革新的なデザインと前例のない高さは、パリの芸術家や知識人の間で激しい論争を引き起こし、彼らは「エッフェル塔に反対する芸術家たち」という嘆願書を発表し、優雅なパリのスカイラインを台無しにする怪物のような鉄の怪物だと非難しました。著名な批評家には作家ギ・ド・モーパッサンが含まれ、彼は毎日塔のレストランで昼食を食べたと伝えられていますが、それは塔が見えないパリで唯一の場所だったからです。建設は1887年1月に始まり、驚くべき2年2ヶ月5日で完成し、エッフェルの工学的能力と組織力の証となりました。塔には18,038個の金属部品、250万個のリベット、300人以上の労働者が必要でした。プロジェクトの巨大な規模と作業が行われた高さにもかかわらず、建設中に死亡した労働者はわずか1人でした。訪問のヒント：日没時に訪れるとパリの黄金の景色と夜の輝くライトショーの両方を楽しめ、チケットはオンラインで事前予約することをお勧めし、2階まで階段で登るとより安く混雑を避けられます。',
        historicalInfo: 'エッフェル塔は1889年の万国博覧会のために建設され、当初はフランスの主要な芸術家や知識人から批判されました。フランスの世界的な文化的象徴となっています。',
        yearBuilt: '1887-1889年',
        architect: 'ギュスターヴ・エッフェル'
      },
      pt: {
        name: 'Torre Eiffel',
        narration: 'Bem-vindo à Torre Eiffel, a dama de ferro de Paris. Construída para a Exposição Universal de 1889, tornou-se o ícone global da França.',
        description: 'O monumento pago mais visitado do mundo',
        historicalInfo: 'A Torre Eiffel foi construída para a Exposição Universal de 1889 e foi inicialmente criticada por alguns dos principais artistas e intelectuais da França. Tornou-se um ícone cultural global da França.',
        yearBuilt: '1887-1889',
        architect: 'Gustave Eiffel'
      },
      ru: {
        name: 'Эйфелева башня',
        narration: 'Добро пожаловать на Эйфелеву башню, железную леди Парижа. Построенная для Всемирной выставки 1889 года, она стала мировым символом Франции.',
        description: 'Самый посещаемый платный памятник в мире',
        historicalInfo: 'Эйфелева башня была построена для Всемирной выставки 1889 года и первоначально подвергалась критике со стороны некоторых ведущих французских художников и интеллектуалов. Она стала глобальным культурным символом Франции.',
        yearBuilt: '1887-1889 гг.',
        architect: 'Гюстав Эйфель'
      }
    }
  },
  {
    id: 'louvre',
    cityId: 'paris',
    name: 'Louvre Museum',
    lat: 48.860294,
    lng: 2.338629,
    radius: 60,
    narration: 'You are at the Louvre Museum, the world\'s largest art museum. Home to thousands of works including the Mona Lisa.',
    description: 'The world\'s largest art museum and a historic monument',
    category: 'Museum',
    detailedDescription: 'The Louvre Museum, or Musée du Louvre, stands as the world\'s largest and most visited art museum, housing an incomparable collection of over 380,000 objects and displaying 35,000 works of art across 72,735 square meters (782,910 square feet) of galleries. Located in the historic Louvre Palace on the Right Bank of the Seine in Paris, this magnificent institution attracts approximately 10 million visitors annually, making it not only a temple of art but also a pilgrimage site for culture enthusiasts from around the globe. The Louvre\'s history is as rich and layered as the artworks it contains. The site began as a fortress built by King Philippe Auguste in the late 12th century to protect Paris from Viking invasions. Archaeological remains of this medieval fortress can still be seen in the museum\'s basement. In the 14th century, Charles V transformed the fortress into a royal residence, beginning its evolution into a palace. The modern Louvre palace took shape during the Renaissance when Francis I, a great patron of the arts who brought Leonardo da Vinci to France, demolished the old fortress and began constructing a Renaissance palace in 1546. Successive monarchs, particularly Louis XIV before he moved the court to Versailles, continued expanding and embellishing the palace, creating the magnificent complex we see today. The Louvre\'s transformation into a public museum began during the French Revolution. In 1793, the revolutionary government opened the Musée Central des Arts in the Grande Galerie, displaying the royal collection and artworks confiscated from the church and émigrés. Napoleon Bonaparte greatly expanded the collection through his military campaigns, bringing treasures from across Europe and Egypt. Though many pieces were returned after his defeat, the Louvre retained a substantial collection that formed the basis of its current holdings. The museum\'s collections span from ancient civilizations to the mid-19th century and are divided into eight curatorial departments: Egyptian Antiquities, Near Eastern Antiquities, Greek and Roman Antiquities, Islamic Art, Sculpture, Decorative Arts, Paintings, and Prints and Drawings. Among its most famous treasures are Leonardo da Vinci\'s "Mona Lisa," the enigmatic portrait that draws millions of visitors who wait in long lines for a glimpse of her mysterious smile. The ancient Greek sculpture "Venus de Milo," depicting the goddess Aphrodite, captivates with her timeless beauty despite her missing arms. The "Winged Victory of Samothrace," a Hellenistic sculpture of Nike, the goddess of victory, commands attention at the top of the Daru staircase, her powerful form seemingly in motion despite being carved from marble over 2,000 years ago. The museum underwent dramatic transformation in the 1980s under President François Mitterrand\'s "Grand Louvre" project. The most controversial element was I.M. Pei\'s glass pyramid, completed in 1989, which serves as the museum\'s main entrance. Initially criticized as a modern intrusion on the historic palace, the pyramid has become an iconic symbol of the Louvre, its geometric form creating a striking dialogue between classical and contemporary architecture. The pyramid is surrounded by three smaller pyramids and fountains, creating the Cour Napoléon, a space where visitors gather before descending into the vast underground lobby that connects the museum\'s three wings: Sully, Richelieu, and Denon. The Louvre\'s galleries are a journey through human creativity and civilization. In the Egyptian Antiquities department, visitors encounter mummies, sarcophagi, and the monumental Great Sphinx of Tanis. The Near Eastern Antiquities house the Code of Hammurabi, one of the oldest deciphered writings of significant length in the world. The Greek and Roman galleries showcase classical sculptures, pottery, and jewelry that influenced Western art for millennia. The Painting galleries feature masterpieces by Caravaggio, Rembrandt, Vermeer, and countless other masters. Delacroix\'s "Liberty Leading the People" captures the revolutionary spirit of France, while Géricault\'s "The Raft of the Medusa" confronts viewers with the drama and horror of a tragic maritime disaster. The museum\'s Islamic Art department, housed in a stunning modern wing covered by an undulating golden veil designed by architects Rudy Ricciotti and Mario Bellini, displays treasures from three continents spanning 1,300 years. The Louvre is not merely a repository of art but a living institution that continues to evolve. It organizes major temporary exhibitions, conducts scholarly research, and undertakes conservation projects to preserve its treasures for future generations. The museum has also expanded globally, with the Louvre Abu Dhabi opening in 2017, extending the institution\'s mission to new audiences. Recent initiatives have focused on improving visitor experience, including timed entry tickets to manage crowds, enhanced digital guides, and special programs for families and students. The museum has also committed to transparency regarding the provenance of works in its collection, addressing historical injustices and working toward restitution when appropriate. Today, the Louvre stands as more than a museum - it is a symbol of human cultural achievement, a place where the greatest works of art from civilizations across time and space come together under one roof. Walking through its galleries is to journey through human history, to witness the evolution of artistic expression, and to stand before works that have moved, inspired, and challenged viewers for centuries. The Louvre reminds us of our shared cultural heritage and the enduring power of art to transcend time, language, and borders.',
    photos: [
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
      'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800',
      'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=800'
    ],
    historicalInfo: 'The Louvre was originally a royal palace before becoming a public museum during the French Revolution in 1793. It houses approximately 38,000 objects from prehistory to the 21st century.',
    yearBuilt: 'Palace: 12th century onwards, Museum: 1793',
    architect: 'Multiple architects over centuries, Modern pyramid: I.M. Pei',
    translations: {
      en: {
        name: 'Louvre Museum',
        narration: 'You are at the Louvre Museum, the world\'s largest art museum. Home to thousands of works including the Mona Lisa.',
        description: 'The world\'s largest art museum and a historic monument',
        detailedDescription: 'The Louvre Museum, or Musée du Louvre, stands as the world\'s largest and most visited art museum, housing an incomparable collection of over 380,000 objects and displaying 35,000 works of art across 72,735 square meters (782,910 square feet) of galleries. Located in the historic Louvre Palace on the Right Bank of the Seine in Paris, this magnificent institution attracts approximately 10 million visitors annually, making it not only a temple of art but also a pilgrimage site for culture enthusiasts from around the globe. The Louvre\'s history is as rich and layered as the artworks it contains. The site began as a fortress built by King Philippe Auguste in the late 12th century to protect Paris from Viking invasions. Archaeological remains of this medieval fortress can still be seen in the museum\'s basement. In the 14th century, Charles V transformed the fortress into a royal residence, beginning its evolution into a palace. The modern Louvre palace took shape during the Renaissance when Francis I, a great patron of the arts who brought Leonardo da Vinci to France, demolished the old fortress and began constructing a Renaissance palace in 1546. Successive monarchs, particularly Louis XIV before he moved the court to Versailles, continued expanding and embellishing the palace, creating the magnificent complex we see today. The Louvre\'s transformation into a public museum began during the French Revolution. In 1793, the revolutionary government opened the Musée Central des Arts in the Grande Galerie, displaying the royal collection and artworks confiscated from the church and émigrés. Napoleon Bonaparte greatly expanded the collection through his military campaigns, bringing treasures from across Europe and Egypt. Though many pieces were returned after his defeat, the Louvre retained a substantial collection that formed the basis of its current holdings. The museum\'s collections span from ancient civilizations to the mid-19th century and are divided into eight curatorial departments: Egyptian Antiquities, Near Eastern Antiquities, Greek and Roman Antiquities, Islamic Art, Sculpture, Decorative Arts, Paintings, and Prints and Drawings. Among its most famous treasures are Leonardo da Vinci\'s "Mona Lisa," the enigmatic portrait that draws millions of visitors who wait in long lines for a glimpse of her mysterious smile. The ancient Greek sculpture "Venus de Milo," depicting the goddess Aphrodite, captivates with her timeless beauty despite her missing arms. The "Winged Victory of Samothrace," a Hellenistic sculpture of Nike, the goddess of victory, commands attention at the top of the Daru staircase, her powerful form seemingly in motion despite being carved from marble over 2,000 years ago. The museum underwent dramatic transformation in the 1980s under President François Mitterrand\'s "Grand Louvre" project. The most controversial element was I.M. Pei\'s glass pyramid, completed in 1989, which serves as the museum\'s main entrance. Initially criticized as a modern intrusion on the historic palace, the pyramid has become an iconic symbol of the Louvre, its geometric form creating a striking dialogue between classical and contemporary architecture. The pyramid is surrounded by three smaller pyramids and fountains, creating the Cour Napoléon, a space where visitors gather before descending into the vast underground lobby that connects the museum\'s three wings: Sully, Richelieu, and Denon. The Louvre\'s galleries are a journey through human creativity and civilization. In the Egyptian Antiquities department, visitors encounter mummies, sarcophagi, and the monumental Great Sphinx of Tanis. The Near Eastern Antiquities house the Code of Hammurabi, one of the oldest deciphered writings of significant length in the world. The Greek and Roman galleries showcase classical sculptures, pottery, and jewelry that influenced Western art for millennia. The Painting galleries feature masterpieces by Caravaggio, Rembrandt, Vermeer, and countless other masters. Delacroix\'s "Liberty Leading the People" captures the revolutionary spirit of France, while Géricault\'s "The Raft of the Medusa" confronts viewers with the drama and horror of a tragic maritime disaster. The museum\'s Islamic Art department, housed in a stunning modern wing covered by an undulating golden veil designed by architects Rudy Ricciotti and Mario Bellini, displays treasures from three continents spanning 1,300 years. The Louvre is not merely a repository of art but a living institution that continues to evolve. It organizes major temporary exhibitions, conducts scholarly research, and undertakes conservation projects to preserve its treasures for future generations. The museum has also expanded globally, with the Louvre Abu Dhabi opening in 2017, extending the institution\'s mission to new audiences. Recent initiatives have focused on improving visitor experience, including timed entry tickets to manage crowds, enhanced digital guides, and special programs for families and students. The museum has also committed to transparency regarding the provenance of works in its collection, addressing historical injustices and working toward restitution when appropriate. Today, the Louvre stands as more than a museum - it is a symbol of human cultural achievement, a place where the greatest works of art from civilizations across time and space come together under one roof. Walking through its galleries is to journey through human history, to witness the evolution of artistic expression, and to stand before works that have moved, inspired, and challenged viewers for centuries. The Louvre reminds us of our shared cultural heritage and the enduring power of art to transcend time, language, and borders.'
      },
      it: {
        name: 'Museo del Louvre',
        narration: 'Ti trovi al Museo del Louvre, il più grande museo d\'arte del mondo. Ospita migliaia di opere tra cui la Gioconda.',
        description: 'Il più grande museo d\'arte del mondo e un monumento storico',
        historicalInfo: 'Il Louvre era originariamente un palazzo reale prima di diventare un museo pubblico durante la Rivoluzione francese nel 1793. Ospita circa 38.000 oggetti dalla preistoria al XXI secolo.',
        yearBuilt: 'Palazzo: dal XII secolo in poi, Museo: 1793',
        architect: 'Più architetti nel corso dei secoli, Piramide moderna: I.M. Pei'
      },
      ko: {
        name: '루브르 박물관',
        narration: '세계 최대의 미술관인 루브르 박물관에 오셨습니다. 모나리자를 포함한 수천 점의 작품이 소장되어 있습니다.',
        description: '세계 최대의 미술관이자 역사적 기념물',
        detailedDescription: '루브르 박물관(Musée du Louvre)은 세계에서 가장 크고 가장 많이 방문되는 미술관으로, 72,735평방미터(782,910평방피트)의 갤러리 공간에 380,000점 이상의 유물을 소장하고 35,000점의 예술 작품을 전시하고 있습니다. 파리의 센 강 우안에 위치한 역사적인 루브르 궁전에 자리한 이 장엄한 기관은 매년 약 1,000만 명의 방문객을 끌어모으며, 예술의 전당일 뿐만 아니라 전 세계 문화 애호가들의 순례지이기도 합니다. 루브르의 역사는 그곳에 소장된 예술 작품만큼이나 풍부하고 다층적입니다. 이 장소는 12세기 후반 필립 오귀스트 왕이 바이킹의 침략으로부터 파리를 보호하기 위해 건설한 요새로 시작되었습니다. 이 중세 요새의 고고학적 유적은 박물관 지하에서 여전히 볼 수 있습니다. 14세기에 샤를 5세가 요새를 왕실 거주지로 개조하면서 궁전으로의 진화가 시작되었습니다. 현대적인 루브르 궁전은 르네상스 시대에 형성되었는데, 레오나르도 다 빈치를 프랑스로 초청한 위대한 예술 후원자 프랑수아 1세가 1546년에 옛 요새를 철거하고 르네상스 궁전 건설을 시작했습니다. 특히 베르사유로 궁정을 옮기기 전의 루이 14세를 비롯한 후대 군주들이 계속해서 궁전을 확장하고 장식하여 오늘날 우리가 보는 웅장한 복합 건축물을 만들었습니다. 루브르가 공공 박물관으로 변모한 것은 프랑스 혁명 기간에 시작되었습니다. 1793년 혁명 정부는 그랑 갤러리에 중앙 예술 박물관(Musée Central des Arts)을 개관하여 왕실 소장품과 교회 및 망명자들로부터 압수한 예술 작품을 전시했습니다. 나폴레옹 보나파르트는 그의 군사 원정을 통해 유럽과 이집트 전역에서 보물을 가져와 소장품을 크게 확대했습니다. 그의 패배 후 많은 작품이 반환되었지만, 루브르는 현재 소장품의 기초를 형성한 상당한 컬렉션을 보유했습니다. 박물관의 소장품은 고대 문명부터 19세기 중반까지 다양하며 8개 큐레토리얼 부서로 나뉩니다. 방문 팁: 수요일과 금요일 야간 개관을 이용하면 혼잡을 피할 수 있으며, 온라인으로 시간 지정 티켓을 미리 예약하고, 덜 알려진 섹션인 이슬람 예술이나 장식 예술 갤러리를 탐험해 보세요.',
        historicalInfo: '루브르는 원래 왕궁이었으나 1793년 프랑스 혁명 중에 공공 박물관이 되었습니다. 선사시대부터 21세기까지 약 38,000점의 유물을 소장하고 있습니다.',
        yearBuilt: '궁전: 12세기 이후, 박물관: 1793년',
        architect: '여러 세기에 걸친 다양한 건축가들, 현대 피라미드: I.M. 페이'
      },
      es: {
        name: 'Museo del Louvre',
        narration: 'Está en el Museo del Louvre, el museo de arte más grande del mundo. Hogar de miles de obras, incluida la Mona Lisa.',
        description: 'El museo de arte más grande del mundo y un monumento histórico',
        historicalInfo: 'El Louvre fue originalmente un palacio real antes de convertirse en museo público durante la Revolución Francesa en 1793. Alberga aproximadamente 38.000 objetos desde la prehistoria hasta el siglo XXI.',
        yearBuilt: 'Palacio: desde el siglo XII en adelante, Museo: 1793',
        architect: 'Múltiples arquitectos a lo largo de los siglos, Pirámide moderna: I.M. Pei'
      },
      fr: {
        name: 'Musée du Louvre',
        narration: 'Vous êtes au Musée du Louvre, le plus grand musée d\'art du monde. Il abrite des milliers d\'œuvres, dont la Joconde.',
        description: 'Le plus grand musée d\'art du monde et un monument historique',
        historicalInfo: 'Le Louvre était à l\'origine un palais royal avant de devenir un musée public pendant la Révolution française en 1793. Il abrite environ 38 000 objets de la préhistoire au XXIe siècle.',
        yearBuilt: 'Palais : à partir du XIIe siècle, Musée : 1793',
        architect: 'Plusieurs architectes au fil des siècles, Pyramide moderne : I.M. Pei'
      },
      de: {
        name: 'Louvre-Museum',
        narration: 'Sie befinden sich im Louvre-Museum, dem größten Kunstmuseum der Welt. Heimat Tausender Werke, darunter die Mona Lisa.',
        description: 'Das größte Kunstmuseum der Welt und ein historisches Denkmal',
        historicalInfo: 'Der Louvre war ursprünglich ein königlicher Palast, bevor er während der Französischen Revolution 1793 zu einem öffentlichen Museum wurde. Er beherbergt etwa 38.000 Objekte von der Vorgeschichte bis zum 21. Jahrhundert.',
        yearBuilt: 'Palast: ab dem 12. Jahrhundert, Museum: 1793',
        architect: 'Mehrere Architekten über Jahrhunderte, Moderne Pyramide: I.M. Pei'
      },
      zh: {
        name: '卢浮宫博物馆',
        narration: '您正在卢浮宫博物馆，世界上最大的艺术博物馆。收藏了包括蒙娜丽莎在内的数千件作品。',
        description: '世界上最大的艺术博物馆和历史古迹',
        detailedDescription: '卢浮宫博物馆（Musée du Louvre）是世界上最大、参观人数最多的艺术博物馆，在72,735平方米（782,910平方英尺）的画廊空间内收藏了超过380,000件文物，展出35,000件艺术作品。这座宏伟的机构位于巴黎塞纳河右岸的历史悠久的卢浮宫内，每年吸引约1000万游客，不仅是艺术殿堂，也是来自全球文化爱好者的朝圣地。卢浮宫的历史与其收藏的艺术品一样丰富多彩、层次分明。这个地点最初是12世纪末菲利普·奥古斯特国王为保护巴黎免受维京人入侵而建造的堡垒。这座中世纪堡垒的考古遗迹至今仍可在博物馆地下室看到。14世纪，查理五世将堡垒改造为皇家住所，开始了其向宫殿的演变。现代卢浮宫在文艺复兴时期成形，当时伟大的艺术赞助人、将列奥纳多·达·芬奇带到法国的弗朗索瓦一世于1546年拆除了旧堡垒，开始建造文艺复兴宫殿。后继的君主，特别是在将宫廷迁往凡尔赛之前的路易十四，继续扩建和装饰宫殿，创造了我们今天看到的宏伟建筑群。卢浮宫向公共博物馆的转变始于法国大革命期间。1793年，革命政府在大画廊开设了中央艺术博物馆（Musée Central des Arts），展示皇家收藏品和从教会及流亡者那里没收的艺术品。拿破仑·波拿巴通过军事征服大大扩展了收藏，从整个欧洲和埃及带回珍宝。尽管在他战败后许多作品被归还，但卢浮宫保留了大量藏品，构成了其当前收藏的基础。博物馆的藏品跨越从古代文明到19世纪中叶，分为8个策展部门。参观提示：利用周三和周五的夜间开放时间可以避开人群，提前在线预订定时门票，探索较少人知的区域如伊斯兰艺术或装饰艺术画廊。',
        historicalInfo: '卢浮宫最初是一座皇家宫殿，1793年法国大革命期间成为公共博物馆。它收藏了约38,000件从史前到21世纪的文物。',
        yearBuilt: '宫殿：12世纪起，博物馆：1793年',
        architect: '几个世纪以来的多位建筑师，现代金字塔：贝聿铭'
      },
      ja: {
        name: 'ルーヴル美術館',
        narration: 'ここは世界最大の美術館、ルーヴル美術館です。モナ・リザを含む数千の作品を所蔵しています。',
        description: '世界最大の美術館であり歴史的建造物',
        detailedDescription: 'ルーヴル美術館（Musée du Louvre）は、世界最大かつ最も訪問者の多い美術館で、72,735平方メートル（782,910平方フィート）のギャラリースペースに380,000点以上の収蔵品があり、35,000点の美術作品を展示しています。パリのセーヌ川右岸にある歴史的なルーヴル宮殿に位置するこの壮大な施設は、年間約1,000万人の訪問者を魅了し、芸術の殿堂であるだけでなく、世界中の文化愛好家の巡礼地となっています。ルーヴルの歴史は、そこに収蔵されている芸術作品と同じくらい豊かで多層的です。この場所は、12世紀後半にフィリップ・オーギュスト王がヴァイキングの侵略からパリを守るために建設した要塞として始まりました。この中世の要塞の考古学的遺跡は、今でも美術館の地下で見ることができます。14世紀、シャルル5世が要塞を王室の住居に改造し、宮殿への進化が始まりました。現代のルーヴル宮殿はルネサンス期に形を成し、レオナルド・ダ・ヴィンチをフランスに招いた偉大な芸術の庇護者フランソワ1世が1546年に古い要塞を取り壊し、ルネサンス様式の宮殿の建設を始めました。特にヴェルサイユに宮廷を移す前のルイ14世をはじめとする歴代の君主たちが、宮殿の拡張と装飾を続け、今日見られる壮大な複合施設を作り上げました。ルーヴルが公共美術館へと変貌したのは、フランス革命期に始まりました。1793年、革命政府はグランド・ギャラリーに中央芸術美術館（Musée Central des Arts）を開設し、王室コレクションと教会や亡命者から没収した芸術作品を展示しました。ナポレオン・ボナパルトは軍事遠征を通じてヨーロッパとエジプト全域から財宝を持ち帰り、コレクションを大幅に拡大しました。彼の敗北後、多くの作品が返還されましたが、ルーヴルは現在の所蔵品の基礎となる相当なコレクションを保持しました。美術館のコレクションは古代文明から19世紀半ばまでをカバーし、8つのキュレーター部門に分かれています。訪問のヒント：水曜日と金曜日の夜間開館を利用すると混雑を避けられ、オンラインで時間指定チケットを事前予約し、イスラム美術や装飾美術ギャラリーなどあまり知られていないセクションを探索してみてください。',
        historicalInfo: 'ルーヴルは元々王宮でしたが、1793年のフランス革命中に公共美術館となりました。先史時代から21世紀までの約38,000点の作品を所蔵しています。',
        yearBuilt: '宮殿：12世紀以降、美術館：1793年',
        architect: '何世紀にもわたる複数の建築家、現代のピラミッド：I.M.ペイ'
      },
      pt: {
        name: 'Museu do Louvre',
        narration: 'Você está no Museu do Louvre, o maior museu de arte do mundo. Lar de milhares de obras, incluindo a Mona Lisa.',
        description: 'O maior museu de arte do mundo e um monumento histórico',
        historicalInfo: 'O Louvre foi originalmente um palácio real antes de se tornar um museu público durante a Revolução Francesa em 1793. Abriga aproximadamente 38.000 objetos da pré-história ao século XXI.',
        yearBuilt: 'Palácio: do século XII em diante, Museu: 1793',
        architect: 'Múltiplos arquitetos ao longo dos séculos, Pirâmide moderna: I.M. Pei'
      },
      ru: {
        name: 'Музей Лувр',
        narration: 'Вы находитесь в музее Лувр, крупнейшем художественном музее мира. Здесь хранятся тысячи произведений, включая Мону Лизу.',
        description: 'Крупнейший художественный музей мира и исторический памятник',
        historicalInfo: 'Лувр первоначально был королевским дворцом, прежде чем стать публичным музеем во время Французской революции в 1793 году. В нем хранится около 38 000 экспонатов от доисторических времен до XXI века.',
        yearBuilt: 'Дворец: с XII века, Музей: 1793',
        architect: 'Множество архитекторов на протяжении веков, Современная пирамида: И.М. Пей'
      }
    }
  },
  {
    id: 'notre_dame',
    cityId: 'paris',
    name: 'Notre-Dame Cathedral',
    lat: 48.852966,
    lng: 2.349902,
    radius: 50,
    narration: 'This is Notre-Dame Cathedral, a masterpiece of French Gothic architecture dating back to the 12th century.',
    description: 'A medieval Catholic cathedral and UNESCO World Heritage Site',
    category: 'Cathedral',
    detailedDescription: 'Notre-Dame de Paris, commonly known as Notre-Dame Cathedral, stands as one of the finest examples of French Gothic architecture and a powerful symbol of Paris, France, and Christian faith. Located on the Île de la Cité, a natural island in the Seine River that has been the heart of Paris since Roman times, this magnificent cathedral has witnessed over 850 years of French history, from medieval coronations to revolutionary turmoil to the tragic fire of 2019. The construction of Notre-Dame began in 1163 under the reign of King Louis VII, with Bishop Maurice de Sully commissioning the cathedral to replace two earlier churches on the site. The ambitious project took nearly two centuries to complete, with the main structure finished by 1260 and additional modifications continuing into the 14th century. This extended construction period resulted in a fascinating blend of architectural styles, though Gothic elements dominate throughout. The cathedral\'s western façade is a masterpiece of Gothic design, featuring two massive towers that rise 69 meters (226 feet) into the Parisian sky. Between these towers sits the famous rose window, a stunning circular stained glass masterpiece measuring 9.6 meters (31 feet) in diameter, depicting scenes from the life of the Virgin Mary. The façade is adorned with three ornate portals, each decorated with intricate stone carvings depicting biblical scenes and figures. The central Portal of the Last Judgment shows Christ presiding over the resurrection of the dead, while the Portal of the Virgin and Portal of St. Anne flank it on either side. Above the portals runs the Gallery of Kings, featuring 28 statues representing the Kings of Judea, though many mistakenly believed them to represent French kings during the Revolution and beheaded them. Inside, Notre-Dame\'s nave stretches 130 meters (427 feet) in length, creating a soaring space that draws the eye heavenward - a fundamental principle of Gothic architecture designed to inspire spiritual contemplation. The interior is supported by flying buttresses, an innovative Gothic engineering solution that transfers the weight of the stone vaulted ceiling to external supports, allowing for higher ceilings and larger windows than previous Romanesque churches could achieve. The cathedral houses three magnificent rose windows, each a triumph of medieval craftsmanship. The western rose window, already mentioned, is joined by equally spectacular north and south rose windows, each measuring approximately 13 meters (43 feet) in diameter. These windows, created in the 13th century, depict biblical scenes and saints in vibrant blues, reds, and purples, casting ethereal colored light across the cathedral\'s interior. Notre-Dame has been the setting for numerous pivotal moments in French history. Napoleon Bonaparte crowned himself Emperor here in 1804, taking the crown from Pope Pius VII and placing it on his own head in a dramatic assertion of imperial authority. The cathedral hosted the coronation of Henry VI of England as King of France in 1431 during the Hundred Years\' War. It witnessed the marriage of Mary, Queen of Scots to the French Dauphin in 1558, and served as the site of a Te Deum service following the liberation of Paris in 1944. During the French Revolution, Notre-Dame suffered tremendous damage. Revolutionary forces ransacked the cathedral, destroyed religious imagery, and rededicated it to the Cult of Reason. Many treasures were lost, statues beheaded, and the cathedral fell into disrepair. It wasn\'t until the 19th century that Notre-Dame\'s fortunes reversed, largely due to Victor Hugo\'s 1831 novel "The Hunchback of Notre-Dame" (Notre-Dame de Paris), which sparked renewed interest in Gothic architecture and the cathedral\'s preservation. This led to a major restoration project led by architect Eugène Viollet-le-Duc between 1844 and 1864, which saved the cathedral from potential demolition and added new elements, including the famous spire and gargoyles that have become iconic symbols of the building. The cathedral\'s bells, immortalized in Hugo\'s novel, are legendary. The largest bell, Emmanuel, weighing over 13 tons, has rung for significant national events and continues to mark important occasions. The cathedral\'s pipe organ, one of the world\'s most famous, contains approximately 8,000 pipes and has been played by renowned organists for centuries. On April 15, 2019, the world watched in horror as fire engulfed Notre-Dame, destroying the 19th-century spire and much of the wooden roof structure, known as "the forest" due to its complex timber framework dating to the 13th century. However, the stone vaults largely held, protecting the interior, and heroic efforts by firefighters saved the structure from total destruction. The north and south rose windows survived, as did many precious artifacts and relics, including the Crown of Thorns believed to have been worn by Jesus. The catastrophe sparked an international outpouring of support, with over one billion euros pledged for reconstruction. French President Emmanuel Macron committed to rebuilding the cathedral within five years, and extensive restoration work is currently underway. Archaeologists and historians are using this opportunity to study the building in unprecedented detail, making discoveries about medieval construction techniques and the cathedral\'s long history. Notre-Dame de Paris remains more than a building - it is a testament to human artistic achievement, religious devotion, and cultural resilience. As reconstruction continues, the cathedral stands as a symbol of hope and renewal, destined to rise again from the ashes to continue its role as a spiritual home, architectural masterpiece, and enduring symbol of Paris and France for generations to come.',
    photos: [
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
      'https://images.unsplash.com/photo-1591289009723-aef0a1a8a211?w=800',
      'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=800'
    ],
    historicalInfo: 'Notre-Dame de Paris is a medieval Catholic cathedral dedicated to the Virgin Mary. It is considered one of the finest examples of French Gothic architecture and was badly damaged by fire in 2019.',
    yearBuilt: '1163-1345',
    architect: 'Multiple architects, major restoration by Eugène Viollet-le-Duc',
    translations: {
      en: {
        name: 'Notre-Dame Cathedral',
        narration: 'This is Notre-Dame Cathedral, a masterpiece of French Gothic architecture dating back to the 12th century.',
        description: 'A medieval Catholic cathedral and UNESCO World Heritage Site',
        detailedDescription: 'Notre-Dame de Paris, commonly known as Notre-Dame Cathedral, stands as one of the finest examples of French Gothic architecture and a powerful symbol of Paris, France, and Christian faith. Located on the Île de la Cité, a natural island in the Seine River that has been the heart of Paris since Roman times, this magnificent cathedral has witnessed over 850 years of French history, from medieval coronations to revolutionary turmoil to the tragic fire of 2019. The construction of Notre-Dame began in 1163 under the reign of King Louis VII, with Bishop Maurice de Sully commissioning the cathedral to replace two earlier churches on the site. The ambitious project took nearly two centuries to complete, with the main structure finished by 1260 and additional modifications continuing into the 14th century. This extended construction period resulted in a fascinating blend of architectural styles, though Gothic elements dominate throughout. The cathedral\'s western façade is a masterpiece of Gothic design, featuring two massive towers that rise 69 meters (226 feet) into the Parisian sky. Between these towers sits the famous rose window, a stunning circular stained glass masterpiece measuring 9.6 meters (31 feet) in diameter, depicting scenes from the life of the Virgin Mary. The façade is adorned with three ornate portals, each decorated with intricate stone carvings depicting biblical scenes and figures. The central Portal of the Last Judgment shows Christ presiding over the resurrection of the dead, while the Portal of the Virgin and Portal of St. Anne flank it on either side. Above the portals runs the Gallery of Kings, featuring 28 statues representing the Kings of Judea, though many mistakenly believed them to represent French kings during the Revolution and beheaded them. Inside, Notre-Dame\'s nave stretches 130 meters (427 feet) in length, creating a soaring space that draws the eye heavenward - a fundamental principle of Gothic architecture designed to inspire spiritual contemplation. The interior is supported by flying buttresses, an innovative Gothic engineering solution that transfers the weight of the stone vaulted ceiling to external supports, allowing for higher ceilings and larger windows than previous Romanesque churches could achieve. The cathedral houses three magnificent rose windows, each a triumph of medieval craftsmanship. The western rose window, already mentioned, is joined by equally spectacular north and south rose windows, each measuring approximately 13 meters (43 feet) in diameter. These windows, created in the 13th century, depict biblical scenes and saints in vibrant blues, reds, and purples, casting ethereal colored light across the cathedral\'s interior. Notre-Dame has been the setting for numerous pivotal moments in French history. Napoleon Bonaparte crowned himself Emperor here in 1804, taking the crown from Pope Pius VII and placing it on his own head in a dramatic assertion of imperial authority. The cathedral hosted the coronation of Henry VI of England as King of France in 1431 during the Hundred Years\' War. It witnessed the marriage of Mary, Queen of Scots to the French Dauphin in 1558, and served as the site of a Te Deum service following the liberation of Paris in 1944. During the French Revolution, Notre-Dame suffered tremendous damage. Revolutionary forces ransacked the cathedral, destroyed religious imagery, and rededicated it to the Cult of Reason. Many treasures were lost, statues beheaded, and the cathedral fell into disrepair. It wasn\'t until the 19th century that Notre-Dame\'s fortunes reversed, largely due to Victor Hugo\'s 1831 novel "The Hunchback of Notre-Dame" (Notre-Dame de Paris), which sparked renewed interest in Gothic architecture and the cathedral\'s preservation. This led to a major restoration project led by architect Eugène Viollet-le-Duc between 1844 and 1864, which saved the cathedral from potential demolition and added new elements, including the famous spire and gargoyles that have become iconic symbols of the building. The cathedral\'s bells, immortalized in Hugo\'s novel, are legendary. The largest bell, Emmanuel, weighing over 13 tons, has rung for significant national events and continues to mark important occasions. The cathedral\'s pipe organ, one of the world\'s most famous, contains approximately 8,000 pipes and has been played by renowned organists for centuries. On April 15, 2019, the world watched in horror as fire engulfed Notre-Dame, destroying the 19th-century spire and much of the wooden roof structure, known as "the forest" due to its complex timber framework dating to the 13th century. However, the stone vaults largely held, protecting the interior, and heroic efforts by firefighters saved the structure from total destruction. The north and south rose windows survived, as did many precious artifacts and relics, including the Crown of Thorns believed to have been worn by Jesus. The catastrophe sparked an international outpouring of support, with over one billion euros pledged for reconstruction. French President Emmanuel Macron committed to rebuilding the cathedral within five years, and extensive restoration work is currently underway. Archaeologists and historians are using this opportunity to study the building in unprecedented detail, making discoveries about medieval construction techniques and the cathedral\'s long history. Notre-Dame de Paris remains more than a building - it is a testament to human artistic achievement, religious devotion, and cultural resilience. As reconstruction continues, the cathedral stands as a symbol of hope and renewal, destined to rise again from the ashes to continue its role as a spiritual home, architectural masterpiece, and enduring symbol of Paris and France for generations to come.'
      },
      it: {
        name: 'Cattedrale di Notre-Dame',
        narration: 'Questa è la Cattedrale di Notre-Dame, un capolavoro dell\'architettura gotica francese risalente al XII secolo.',
        description: 'Una cattedrale cattolica medievale e patrimonio mondiale dell\'UNESCO',
        historicalInfo: 'Notre-Dame de Paris è una cattedrale cattolica medievale dedicata alla Vergine Maria. È considerata uno dei migliori esempi di architettura gotica francese ed è stata gravemente danneggiata da un incendio nel 2019.',
        yearBuilt: '1163-1345',
        architect: 'Più architetti, restauro importante di Eugène Viollet-le-Duc'
      },
      ko: {
        name: '노트르담 대성당',
        narration: '이곳은 12세기로 거슬러 올라가는 프랑스 고딕 건축의 걸작, 노트르담 대성당입니다.',
        description: '중세 가톨릭 대성당이자 유네스코 세계문화유산',
        detailedDescription: '노트르담 드 파리는 프랑스 고딕 건축의 가장 훌륭한 사례 중 하나이자 파리, 프랑스, 그리고 기독교 신앙의 강력한 상징으로 서 있습니다. 로마 시대부터 파리의 심장이었던 센 강의 자연 섬인 시테 섬에 위치한 이 장엄한 대성당은 850년 이상의 프랑스 역사를 목격해 왔으며, 중세 대관식부터 혁명의 혼란, 그리고 2019년의 비극적인 화재까지 겪었습니다. 노트르담의 건설은 1163년 루이 7세 통치 하에 시작되었으며, 모리스 드 쉴리 주교가 이 부지의 두 개의 이전 교회를 대체하기 위해 대성당을 의뢰했습니다. 야심찬 이 프로젝트는 완성하는 데 거의 2세기가 걸렸으며, 주요 구조는 1260년에 완성되었고 14세기까지 추가 수정이 계속되었습니다. 이 긴 건설 기간으로 인해 건축 양식의 매력적인 혼합이 이루어졌지만, 고딕 요소가 전체적으로 지배합니다. 대성당의 서쪽 파사드는 고딕 디자인의 걸작으로, 파리 하늘로 69미터(226피트) 솟아오른 두 개의 거대한 탑이 특징입니다. 이 탑들 사이에는 유명한 장미창이 있는데, 직경 9.6미터(31피트)의 놀라운 원형 스테인드글라스 걸작으로 성모 마리아의 생애 장면을 묘사하고 있습니다. 파사드는 성경 장면과 인물을 묘사한 복잡한 석조 조각으로 장식된 세 개의 화려한 포털로 장식되어 있습니다. 중앙의 최후의 심판 포털은 죽은 자의 부활을 주재하는 그리스도를 보여주며, 성모의 포털과 성 안나의 포털이 양쪽에 있습니다. 포털 위에는 유다 왕들을 나타내는 28개의 조각상이 있는 왕들의 갤러리가 있지만, 많은 사람들이 혁명 중에 프랑스 왕들을 나타낸다고 잘못 믿고 참수했습니다. 내부에서 노트르담의 본당은 길이 130미터(427피트)로 뻗어 있어 시선을 하늘로 이끄는 웅장한 공간을 만듭니다. 방문 팁: 복원 작업이 진행 중이지만 외부에서 건축물을 감상할 수 있으며, 인근 생트 샤펠의 놀라운 스테인드글라스를 방문하고, 대성당 광장에서 노트르담의 역사적 중요성을 반추해 보세요.',
        historicalInfo: '노트르담 드 파리는 성모 마리아에게 봉헌된 중세 가톨릭 대성당입니다. 프랑스 고딕 건축의 가장 훌륭한 사례 중 하나로 여겨지며 2019년 화재로 심각한 피해를 입었습니다.',
        yearBuilt: '1163-1345년',
        architect: '여러 건축가들, 외젠 비올레르뒤크의 주요 복원'
      },
      es: {
        name: 'Catedral de Notre-Dame',
        narration: 'Esta es la Catedral de Notre-Dame, una obra maestra de la arquitectura gótica francesa que data del siglo XII.',
        description: 'Una catedral católica medieval y Patrimonio de la Humanidad de la UNESCO',
        historicalInfo: 'Notre-Dame de París es una catedral católica medieval dedicada a la Virgen María. Se considera uno de los mejores ejemplos de arquitectura gótica francesa y fue gravemente dañada por un incendio en 2019.',
        yearBuilt: '1163-1345',
        architect: 'Múltiples arquitectos, restauración importante de Eugène Viollet-le-Duc'
      },
      fr: {
        name: 'Cathédrale Notre-Dame',
        narration: 'Voici la Cathédrale Notre-Dame, un chef-d\'œuvre de l\'architecture gothique française datant du XIIe siècle.',
        description: 'Une cathédrale catholique médiévale et site du patrimoine mondial de l\'UNESCO',
        historicalInfo: 'Notre-Dame de Paris est une cathédrale catholique médiévale dédiée à la Vierge Marie. Elle est considérée comme l\'un des plus beaux exemples d\'architecture gothique française et a été gravement endommagée par un incendie en 2019.',
        yearBuilt: '1163-1345',
        architect: 'Plusieurs architectes, restauration majeure par Eugène Viollet-le-Duc'
      },
      de: {
        name: 'Kathedrale Notre-Dame',
        narration: 'Dies ist die Kathedrale Notre-Dame, ein Meisterwerk französischer Gotik aus dem 12. Jahrhundert.',
        description: 'Eine mittelalterliche katholische Kathedrale und UNESCO-Weltkulturerbe',
        historicalInfo: 'Notre-Dame de Paris ist eine mittelalterliche katholische Kathedrale, die der Jungfrau Maria gewidmet ist. Sie gilt als eines der schönsten Beispiele französischer Gotik und wurde 2019 durch einen Brand schwer beschädigt.',
        yearBuilt: '1163-1345',
        architect: 'Mehrere Architekten, große Restaurierung durch Eugène Viollet-le-Duc'
      },
      zh: {
        name: '巴黎圣母院',
        narration: '这是巴黎圣母院，可追溯至12世纪的法国哥特式建筑杰作。',
        description: '中世纪天主教大教堂和联合国教科文组织世界遗产',
        detailedDescription: '巴黎圣母院（Notre-Dame de Paris）是法国哥特式建筑的最杰出典范之一，也是巴黎、法国和基督教信仰的强大象征。这座宏伟的大教堂位于西岱岛（Île de la Cité），这是塞纳河中的一个天然岛屿，自罗马时代以来一直是巴黎的心脏。大教堂见证了850多年的法国历史，从中世纪加冕礼到革命动荡，再到2019年的悲惨火灾。巴黎圣母院的建设始于1163年路易七世统治时期，主教莫里斯·德·苏利委托建造这座大教堂以取代该地的两座早期教堂。这个雄心勃勃的项目耗时近两个世纪才完成，主体结构于1260年完工，14世纪继续进行额外的修改。这一漫长的建设期造就了建筑风格的迷人融合，尽管哥特式元素贯穿始终。大教堂的西立面是哥特式设计的杰作，两座巨大的塔楼高耸入巴黎天空69米（226英尺）。在这两座塔楼之间是著名的玫瑰窗，这是一个直径9.6米（31英尺）的惊人圆形彩色玻璃杰作，描绘了圣母玛利亚生平的场景。立面装饰有三个华丽的门廊，每个门廊都装饰着描绘圣经场景和人物的复杂石雕。中央的最后审判门廊展示了主持死者复活的基督，圣母门廊和圣安娜门廊分列两侧。门廊上方是国王画廊，有28座代表犹大国王的雕像，尽管许多人在大革命期间误认为它们代表法国国王而将其斩首。在内部，巴黎圣母院的中殿长达130米（427英尺），创造了一个引导视线向上的宏伟空间——这是哥特式建筑旨在将信徒的思想提升到天堂的基本原则。参观提示：虽然修复工作正在进行中，但您可以从外部欣赏这座建筑，参观附近圣礼拜堂（Sainte-Chapelle）令人惊叹的彩色玻璃窗，并在大教堂广场上思考巴黎圣母院的历史意义。',
        historicalInfo: '巴黎圣母院是一座献给圣母玛利亚的中世纪天主教大教堂。它被认为是法国哥特式建筑的最佳典范之一，在2019年的火灾中严重受损。',
        yearBuilt: '1163-1345年',
        architect: '多位建筑师，欧仁·维奥莱-勒-杜克的主要修复'
      },
      ja: {
        name: 'ノートルダム大聖堂',
        narration: 'これは12世紀にさかのぼるフランス・ゴシック建築の傑作、ノートルダム大聖堂です。',
        description: '中世のカトリック大聖堂でユネスコ世界遺産',
        detailedDescription: 'ノートルダム・ド・パリ（Notre-Dame de Paris）は、フランス・ゴシック建築の最も優れた例の一つであり、パリ、フランス、そしてキリスト教信仰の強力な象徴として立っています。ローマ時代からパリの中心であったセーヌ川の自然の島、シテ島に位置するこの壮大な大聖堂は、中世の戴冠式から革命の混乱、そして2019年の悲劇的な火災まで、850年以上のフランス史を目撃してきました。ノートルダムの建設は1163年にルイ7世の治世下で始まり、モーリス・ド・シュリー司教がこの場所にあった2つの古い教会に代わる大聖堂を委託しました。この野心的なプロジェクトは完成に約2世紀を要し、主要構造は1260年に完成し、14世紀まで追加の修正が続きました。この長い建設期間により、建築様式の魅力的な融合が生まれましたが、ゴシック様式の要素が全体を支配しています。大聖堂の西ファサードはゴシックデザインの傑作で、パリの空に69メートル（226フィート）そびえる2つの巨大な塔が特徴です。これらの塔の間には有名なバラ窓があり、直径9.6メートル（31フィート）の見事な円形ステンドグラスの傑作で、聖母マリアの生涯の場面を描いています。ファサードは、聖書の場面と人物を描いた複雑な石彫で装飾された3つの華麗なポータルで飾られています。中央の最後の審判のポータルは、死者の復活を司るキリストを示し、聖母のポータルと聖アンナのポータルが両側に並んでいます。ポータルの上には、ユダの王たちを表す28の彫像からなる王のギャラリーが並んでいますが、多くの人が革命中にフランスの王を表すと誤って信じて斬首しました。内部では、ノートルダムの身廊は長さ130メートル（427フィート）に及び、視線を天に導く壮大な空間を作り出します。これは信者の心を天国に向けることを目的とするゴシック建築の基本原則です。訪問のヒント：修復作業が進行中ですが、外部から建築物を鑑賞でき、近くのサント・シャペルの素晴らしいステンドグラスを訪れ、大聖堂広場でノートルダムの歴史的重要性を振り返ることができます。',
        historicalInfo: 'ノートルダム・ド・パリは聖母マリアに捧げられた中世のカトリック大聖堂です。フランス・ゴシック建築の最高傑作の一つとされ、2019年の火災で大きな被害を受けました。',
        yearBuilt: '1163-1345年',
        architect: '複数の建築家、ウジェーヌ・ヴィオレ＝ル＝デュクによる大規模修復'
      },
      pt: {
        name: 'Catedral de Notre-Dame',
        narration: 'Esta é a Catedral de Notre-Dame, uma obra-prima da arquitetura gótica francesa que remonta ao século XII.',
        description: 'Uma catedral católica medieval e Patrimônio Mundial da UNESCO',
        historicalInfo: 'Notre-Dame de Paris é uma catedral católica medieval dedicada à Virgem Maria. É considerada um dos melhores exemplos de arquitetura gótica francesa e foi gravemente danificada por um incêndio em 2019.',
        yearBuilt: '1163-1345',
        architect: 'Múltiplos arquitetos, grande restauração por Eugène Viollet-le-Duc'
      },
      ru: {
        name: 'Собор Нотр-Дам',
        narration: 'Это собор Нотр-Дам, шедевр французской готической архитектуры, датируемый XII веком.',
        description: 'Средневековый католический собор и объект Всемирного наследия ЮНЕСКО',
        historicalInfo: 'Собор Парижской Богоматери - средневековый католический собор, посвященный Деве Марии. Он считается одним из лучших образцов французской готической архитектуры и был серьезно поврежден пожаром в 2019 году.',
        yearBuilt: '1163-1345',
        architect: 'Несколько архитекторов, крупная реставрация Эжена Виолле-ле-Дюка'
      }
    }
  },
  {
    id: 'arc_triomphe',
    cityId: 'paris',
    name: 'Arc de Triomphe',
    lat: 48.873787,
    lng: 2.295047,
    radius: 50,
    narration: 'The Arc de Triomphe honors those who fought for France. It stands at the center of Place Charles de Gaulle.',
    description: 'One of the most famous monuments in Paris',
    category: 'Monument',
    detailedDescription: 'The Arc de Triomphe de l\'Étoile, commonly known as the Arc de Triomphe, stands as one of the most iconic monuments in Paris and a powerful symbol of French national pride, military glory, and historical memory. Located at the center of the Place Charles de Gaulle (formerly Place de l\'Étoile), at the western end of the Champs-Élysées, this monumental triumphal arch honors those who fought and died for France, particularly during the Revolutionary and Napoleonic Wars. Rising 50 meters (164 feet) in height, 45 meters (148 feet) in width, and 22 meters (72 feet) in depth, the Arc de Triomphe is the second-largest triumphal arch in existence, surpassed only by Arch of Triumph in Pyongyang, North Korea. The monument was commissioned by Napoleon Bonaparte in 1806, following his victory at the Battle of Austerlitz, to commemorate the achievements of the French armies. Napoleon declared, "You will return home through arches of triumph," to his soldiers, and he envisioned a monument that would celebrate French military might for centuries to come. The architect Jean Chalgrin was chosen to design the arch, drawing inspiration from the ancient Roman Arch of Titus while creating something distinctly grander and more ambitious. Construction began in 1806, but progressed slowly due to Napoleon\'s political fortunes. When he married Marie-Louise of Austria in 1810, the arch was far from complete, so a full-scale wooden mock-up was hastily erected for the imperial procession. After Napoleon\'s abdication in 1814, construction halted entirely. Work resumed in 1826 under King Louis-Philippe and was finally completed in 1836, fifteen years after Napoleon\'s death. Tragically, Napoleon never saw his grand monument completed, though his funeral procession did pass under the arch in 1840 when his remains were returned to France from Saint Helena. The Arc de Triomphe is adorned with magnificent sculptural reliefs that tell the story of French military glory. The most famous is François Rude\'s "La Marseillaise" (officially titled "Departure of the Volunteers of 1792"), depicting French citizens rallying to defend the young Republic. This dynamic sculpture, with its central figure of Liberty urging the people forward, has become one of the most celebrated works of French Romantic sculpture. Other major reliefs include "The Triumph of 1810" by Jean-Pierre Cortot, showing Napoleon\'s victories; "Resistance" by Antoine Étex, depicting French resistance during the 1814 campaign; and "Peace" by Étex, celebrating the Treaty of Paris. The arch\'s inner walls are engraved with the names of 660 generals and marshals who served during the French Revolution and Napoleonic Empire. Those who died in battle are underlined, creating a poignant memorial to military leadership and sacrifice. The attic level features shields bearing the names of major Revolutionary and Napoleonic victories, while the four pillars support large sculptural groups representing pivotal moments in French military history. Perhaps the most solemn and significant feature of the Arc de Triomphe is the Tomb of the Unknown Soldier, installed beneath the arch on November 11, 1920, to honor the unidentified French soldiers who died in World War I. The eternal flame, rekindled every evening at 6:30 PM in a ceremony that has continued daily since 1923, serves as France\'s national war memorial. This tradition ensures that the memory of those who gave their lives for France is never extinguished. The flame has burned continuously even during the German occupation of Paris in World War II, a powerful symbol of French resilience and resistance. The Arc de Triomphe has witnessed countless historic moments. Victorious armies have marched beneath it, from the Allies in 1919 following World War I to the liberation of Paris in 1944 when General de Gaulle led Free French forces in a triumphant procession down the Champs-Élysées and through the arch. The monument has also served as a focal point for national mourning, including the funeral processions of presidents, war heroes, and cultural icons. The arch stands at the center of the Place Charles de Gaulle, from which twelve grand avenues radiate in a star pattern, earning the square its former name "Place de l\'Étoile" (Star Square). This urban planning creates one of the world\'s most famous traffic circles and provides spectacular views of the arch from multiple vantage points throughout Paris. Visitors can climb the 284 steps to the top of the arch (an elevator is available for those with reduced mobility), where a viewing platform offers breathtaking panoramic views of Paris. From this vantage point, one can see the Champs-Élysées stretching toward the Louvre and Place de la Concorde in one direction, and the Grande Arche de la Défense continuing the axis in the other, creating what Parisians call the "Voie Triomphale" or Triumphal Way. Inside the arch, a museum traces its history, construction, and symbolic importance in French culture. Exhibitions explore the arch\'s role in French national identity, its architectural significance, and the countless ceremonies and events it has witnessed over two centuries. The Arc de Triomphe appears frequently in popular culture, from literature and film to art and photography, cementing its status as an instantly recognizable symbol of Paris. It has served as the finish line for the Tour de France bicycle race since 1975, adding a sporting dimension to its cultural significance. The monument has also been the site of major celebrations, including Bastille Day military parades and New Year\'s Eve festivities. Recent years have seen the arch at the center of both celebration and protest. In 2018, it suffered vandalism during Yellow Vest protests, highlighting its continued relevance as a symbol of French state power and national identity. In 2021, artist Christo\'s posthumous installation wrapped the entire arch in silvery blue recyclable fabric, transforming this stone monument of permanence into a temporary work of ephemeral art, demonstrating how even the most established symbols can be reimagined for new generations. Today, the Arc de Triomphe stands not merely as a monument to past glories but as a living symbol of French identity, resilience, and collective memory. It reminds visitors and Parisians alike of the sacrifices made for liberty, the importance of national unity, and the enduring power of monumental architecture to inspire, commemorate, and bring people together across generations.',
    photos: [
      'https://images.unsplash.com/photo-1549144511-f099e773c147?w=800',
      'https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?w=800',
      'https://images.unsplash.com/photo-1571167366136-b57e07761625?w=800'
    ],
    historicalInfo: 'The Arc de Triomphe was commissioned by Napoleon in 1806 to honor the French army. It stands at the center of the Place Charles de Gaulle and contains the Tomb of the Unknown Soldier.',
    yearBuilt: '1806-1836',
    architect: 'Jean Chalgrin',
    translations: {
      en: {
        name: 'Arc de Triomphe',
        narration: 'The Arc de Triomphe honors those who fought for France. It stands at the center of Place Charles de Gaulle.',
        description: 'One of the most famous monuments in Paris',
        detailedDescription: 'The Arc de Triomphe de l\'Étoile, commonly known as the Arc de Triomphe, stands as one of the most iconic monuments in Paris and a powerful symbol of French national pride, military glory, and historical memory. Located at the center of the Place Charles de Gaulle (formerly Place de l\'Étoile), at the western end of the Champs-Élysées, this monumental triumphal arch honors those who fought and died for France, particularly during the Revolutionary and Napoleonic Wars. Rising 50 meters (164 feet) in height, 45 meters (148 feet) in width, and 22 meters (72 feet) in depth, the Arc de Triomphe is the second-largest triumphal arch in existence, surpassed only by Arch of Triumph in Pyongyang, North Korea. The monument was commissioned by Napoleon Bonaparte in 1806, following his victory at the Battle of Austerlitz, to commemorate the achievements of the French armies. Napoleon declared, "You will return home through arches of triumph," to his soldiers, and he envisioned a monument that would celebrate French military might for centuries to come. The architect Jean Chalgrin was chosen to design the arch, drawing inspiration from the ancient Roman Arch of Titus while creating something distinctly grander and more ambitious. Construction began in 1806, but progressed slowly due to Napoleon\'s political fortunes. When he married Marie-Louise of Austria in 1810, the arch was far from complete, so a full-scale wooden mock-up was hastily erected for the imperial procession. After Napoleon\'s abdication in 1814, construction halted entirely. Work resumed in 1826 under King Louis-Philippe and was finally completed in 1836, fifteen years after Napoleon\'s death. Tragically, Napoleon never saw his grand monument completed, though his funeral procession did pass under the arch in 1840 when his remains were returned to France from Saint Helena. The Arc de Triomphe is adorned with magnificent sculptural reliefs that tell the story of French military glory. The most famous is François Rude\'s "La Marseillaise" (officially titled "Departure of the Volunteers of 1792"), depicting French citizens rallying to defend the young Republic. This dynamic sculpture, with its central figure of Liberty urging the people forward, has become one of the most celebrated works of French Romantic sculpture. Other major reliefs include "The Triumph of 1810" by Jean-Pierre Cortot, showing Napoleon\'s victories; "Resistance" by Antoine Étex, depicting French resistance during the 1814 campaign; and "Peace" by Étex, celebrating the Treaty of Paris. The arch\'s inner walls are engraved with the names of 660 generals and marshals who served during the French Revolution and Napoleonic Empire. Those who died in battle are underlined, creating a poignant memorial to military leadership and sacrifice. The attic level features shields bearing the names of major Revolutionary and Napoleonic victories, while the four pillars support large sculptural groups representing pivotal moments in French military history. Perhaps the most solemn and significant feature of the Arc de Triomphe is the Tomb of the Unknown Soldier, installed beneath the arch on November 11, 1920, to honor the unidentified French soldiers who died in World War I. The eternal flame, rekindled every evening at 6:30 PM in a ceremony that has continued daily since 1923, serves as France\'s national war memorial. This tradition ensures that the memory of those who gave their lives for France is never extinguished. The flame has burned continuously even during the German occupation of Paris in World War II, a powerful symbol of French resilience and resistance. The Arc de Triomphe has witnessed countless historic moments. Victorious armies have marched beneath it, from the Allies in 1919 following World War I to the liberation of Paris in 1944 when General de Gaulle led Free French forces in a triumphant procession down the Champs-Élysées and through the arch. The monument has also served as a focal point for national mourning, including the funeral processions of presidents, war heroes, and cultural icons. The arch stands at the center of the Place Charles de Gaulle, from which twelve grand avenues radiate in a star pattern, earning the square its former name "Place de l\'Étoile" (Star Square). This urban planning creates one of the world\'s most famous traffic circles and provides spectacular views of the arch from multiple vantage points throughout Paris. Visitors can climb the 284 steps to the top of the arch (an elevator is available for those with reduced mobility), where a viewing platform offers breathtaking panoramic views of Paris. From this vantage point, one can see the Champs-Élysées stretching toward the Louvre and Place de la Concorde in one direction, and the Grande Arche de la Défense continuing the axis in the other, creating what Parisians call the "Voie Triomphale" or Triumphal Way. Inside the arch, a museum traces its history, construction, and symbolic importance in French culture. Exhibitions explore the arch\'s role in French national identity, its architectural significance, and the countless ceremonies and events it has witnessed over two centuries. The Arc de Triomphe appears frequently in popular culture, from literature and film to art and photography, cementing its status as an instantly recognizable symbol of Paris. It has served as the finish line for the Tour de France bicycle race since 1975, adding a sporting dimension to its cultural significance. The monument has also been the site of major celebrations, including Bastille Day military parades and New Year\'s Eve festivities. Recent years have seen the arch at the center of both celebration and protest. In 2018, it suffered vandalism during Yellow Vest protests, highlighting its continued relevance as a symbol of French state power and national identity. In 2021, artist Christo\'s posthumous installation wrapped the entire arch in silvery blue recyclable fabric, transforming this stone monument of permanence into a temporary work of ephemeral art, demonstrating how even the most established symbols can be reimagined for new generations. Today, the Arc de Triomphe stands not merely as a monument to past glories but as a living symbol of French identity, resilience, and collective memory. It reminds visitors and Parisians alike of the sacrifices made for liberty, the importance of national unity, and the enduring power of monumental architecture to inspire, commemorate, and bring people together across generations.'
      },
      it: {
        name: 'Arco di Trionfo',
        narration: 'L\'Arco di Trionfo onora coloro che hanno combattuto per la Francia. Si trova al centro di Place Charles de Gaulle.',
        description: 'Uno dei monumenti più famosi di Parigi',
        historicalInfo: 'L\'Arco di Trionfo fu commissionato da Napoleone nel 1806 per onorare l\'esercito francese. Si trova al centro di Place Charles de Gaulle e contiene la Tomba del Milite Ignoto.',
        yearBuilt: '1806-1836',
        architect: 'Jean Chalgrin'
      },
      ko: {
        name: '개선문',
        narration: '개선문은 프랑스를 위해 싸운 사람들을 기리는 곳입니다. 샤를 드골 광장 중앙에 위치해 있습니다.',
        description: '파리에서 가장 유명한 기념물 중 하나',
        detailedDescription: '에투알 개선문(Arc de Triomphe de l\'Étoile)은 파리에서 가장 상징적인 기념물 중 하나이자 프랑스의 국가적 자긍심, 군사적 영광, 그리고 역사적 기억의 강력한 상징으로 서 있습니다. 샹젤리제 거리의 서쪽 끝, 샤를 드골 광장(구 에투알 광장) 중앙에 위치한 이 기념비적인 개선문은 특히 혁명 전쟁과 나폴레옹 전쟁 동안 프랑스를 위해 싸우고 전사한 이들을 기립니다. 높이 50미터(164피트), 너비 45미터(148피트), 깊이 22미터(72피트)로 솟아오른 개선문은 북한 평양의 개선문 다음으로 세계에서 두 번째로 큰 개선문입니다. 이 기념물은 1806년 나폴레옹 보나파르트가 아우스터리츠 전투에서의 승리 이후 프랑스 군대의 업적을 기념하기 위해 의뢰했습니다. 나폴레옹은 그의 병사들에게 "당신들은 개선문을 통해 귀국할 것이다"라고 선언하며, 수세기 동안 프랑스의 군사적 위력을 기념할 기념물을 구상했습니다. 건축가 장 샬그랭이 아치를 설계하도록 선택되었으며, 고대 로마의 티투스 개선문에서 영감을 받되 훨씬 더 웅장하고 야심찬 것을 창조했습니다. 건설은 1806년에 시작되었지만 나폴레옹의 정치적 운명으로 인해 천천히 진행되었습니다. 1810년 오스트리아의 마리 루이즈와 결혼할 때 아치는 완성과 거리가 멀었기 때문에, 황제의 행렬을 위해 실물 크기의 나무 모형이 급히 세워졌습니다. 1814년 나폴레옹의 퇴위 후 건설은 완전히 중단되었습니다. 작업은 1826년 루이 필립 왕 하에 재개되어 나폴레옹 사망 15년 후인 1836년에 마침내 완성되었습니다. 비극적이게도 나폴레옹은 그의 위대한 기념물이 완성되는 것을 보지 못했지만, 1840년 그의 유해가 세인트 헬레나에서 프랑스로 반환될 때 그의 장례 행렬이 아치 아래를 통과했습니다. 개선문은 프랑스 군사적 영광의 이야기를 전하는 장엄한 조각 부조로 장식되어 있습니다. 방문 팁: 개선문 꼭대기로 올라가 파리의 장엄한 파노라마 전망을 감상하고, 매일 저녁 6시 30분에 열리는 무명용사 묘의 추모식을 참석하며, 12개 방사형 대로의 별 모양 패턴을 관찰해 보세요.',
        historicalInfo: '개선문은 1806년 나폴레옹이 프랑스 군대를 기리기 위해 의뢰했습니다. 샤를 드골 광장 중앙에 위치하며 무명용사의 묘가 있습니다.',
        yearBuilt: '1806-1836년',
        architect: '장 샬그랭'
      },
      es: {
        name: 'Arco del Triunfo',
        narration: 'El Arco del Triunfo honra a quienes lucharon por Francia. Se encuentra en el centro de la Place Charles de Gaulle.',
        description: 'Uno de los monumentos más famosos de París',
        historicalInfo: 'El Arco del Triunfo fue encargado por Napoleón en 1806 para honrar al ejército francés. Se encuentra en el centro de la Place Charles de Gaulle y contiene la Tumba del Soldado Desconocido.',
        yearBuilt: '1806-1836',
        architect: 'Jean Chalgrin'
      },
      fr: {
        name: 'Arc de Triomphe',
        narration: 'L\'Arc de Triomphe rend hommage à ceux qui ont combattu pour la France. Il se dresse au centre de la Place Charles de Gaulle.',
        description: 'L\'un des monuments les plus célèbres de Paris',
        historicalInfo: 'L\'Arc de Triomphe a été commandé par Napoléon en 1806 pour honorer l\'armée française. Il se trouve au centre de la Place Charles de Gaulle et contient la Tombe du Soldat Inconnu.',
        yearBuilt: '1806-1836',
        architect: 'Jean Chalgrin'
      },
      de: {
        name: 'Arc de Triomphe',
        narration: 'Der Arc de Triomphe ehrt diejenigen, die für Frankreich gekämpft haben. Er steht im Zentrum des Place Charles de Gaulle.',
        description: 'Eines der berühmtesten Denkmäler in Paris',
        historicalInfo: 'Der Arc de Triomphe wurde 1806 von Napoleon in Auftrag gegeben, um die französische Armee zu ehren. Er steht im Zentrum des Place Charles de Gaulle und enthält das Grab des Unbekannten Soldaten.',
        yearBuilt: '1806-1836',
        architect: 'Jean Chalgrin'
      },
      zh: {
        name: '凯旋门',
        narration: '凯旋门是为纪念为法国而战的人们而建。它位于戴高乐广场的中心。',
        description: '巴黎最著名的纪念碑之一',
        detailedDescription: '星形广场凯旋门（Arc de Triomphe de l\'Étoile），通常简称凯旋门，是巴黎最具标志性的纪念碑之一，也是法国民族自豪感、军事荣耀和历史记忆的强大象征。这座宏伟的凯旋门位于香榭丽舍大街西端的戴高乐广场（原名星形广场）中心，纪念那些为法国而战并牺牲的人们，特别是在革命战争和拿破仑战争期间。凯旋门高50米（164英尺），宽45米（148英尺），深22米（72英尺），是世界上第二大凯旋门，仅次于朝鲜平壤的凯旋门。这座纪念碑由拿破仑·波拿巴于1806年在奥斯特里茨战役胜利后委托建造，以纪念法国军队的成就。拿破仑向他的士兵宣布："你们将通过凯旋门回家"，他设想了一座将在未来几个世纪庆祝法国军事实力的纪念碑。建筑师让·沙尔格兰被选中设计这座拱门，从古罗马提图斯凯旋门中汲取灵感，同时创造出更加宏伟和雄心勃勃的作品。施工于1806年开始，但由于拿破仑的政治命运而进展缓慢。1810年他与奥地利的玛丽·路易丝结婚时，拱门远未完工，因此为皇家游行匆忙搭建了一个全尺寸的木制模型。1814年拿破仑退位后，施工完全停止。工程于1826年在路易·菲利普国王统治下恢复，最终于1836年完工，距拿破仑去世15年。可悲的是，拿破仑从未看到他宏伟的纪念碑完工，尽管1840年他的遗体从圣赫勒拿岛返回法国时，他的葬礼队伍确实通过了拱门下方。凯旋门装饰有讲述法国军事荣耀故事的宏伟雕刻浮雕。参观提示：登上凯旋门顶部欣赏巴黎壮丽的全景，参加每晚6:30在无名战士墓举行的纪念仪式，观察12条放射状大道形成的星形图案。',
        historicalInfo: '凯旋门由拿破仑于1806年委托建造，以纪念法国军队。它位于戴高乐广场的中心，内有无名战士墓。',
        yearBuilt: '1806-1836年',
        architect: '让·沙尔格兰'
      },
      ja: {
        name: '凱旋門',
        narration: '凱旋門はフランスのために戦った人々を称えます。シャルル・ド・ゴール広場の中心に立っています。',
        description: 'パリで最も有名な記念碑の一つ',
        detailedDescription: 'エトワール凱旋門（Arc de Triomphe de l\'Étoile）、一般に凱旋門として知られるこの記念碑は、パリで最も象徴的な建造物の一つであり、フランスの国民的誇り、軍事的栄光、歴史的記憶の強力なシンボルとして立っています。シャンゼリゼ通りの西端、シャルル・ド・ゴール広場（旧エトワール広場）の中心に位置するこの記念碑的な凱旋門は、特に革命戦争とナポレオン戦争中にフランスのために戦い、死んだ人々を称えています。高さ50メートル（164フィート）、幅45メートル（148フィート）、奥行き22メートル（72フィート）そびえる凱旋門は、北朝鮮平壌の凱旋門に次いで世界で2番目に大きな凱旋門です。この記念碑は1806年、アウステルリッツの戦いでの勝利の後、ナポレオン・ボナパルトがフランス軍の功績を記念するために委託しました。ナポレオンは兵士たちに「あなたたちは凱旋門を通って帰還するだろう」と宣言し、何世紀にもわたってフランスの軍事力を祝う記念碑を構想しました。建築家ジャン・シャルグランがアーチの設計に選ばれ、古代ローマのティトゥスの凱旋門からインスピレーションを得ながら、より壮大で野心的なものを創造しました。建設は1806年に始まりましたが、ナポレオンの政治的運命により進行は遅々としていました。1810年にオーストリアのマリー・ルイーズと結婚したとき、アーチは完成には程遠かったため、皇帝の行列のために実物大の木製模型が急遽建てられました。1814年のナポレオンの退位後、建設は完全に停止しました。工事は1826年にルイ・フィリップ王の下で再開され、ナポレオンの死から15年後の1836年にようやく完成しました。悲劇的に、ナポレオンは彼の壮大な記念碑が完成するのを見ることはありませんでしたが、1840年に彼の遺体がセントヘレナからフランスに戻されたとき、彼の葬列はアーチの下を通過しました。凱旋門はフランスの軍事的栄光の物語を語る壮大な彫刻レリーフで飾られています。訪問のヒント：凱旋門の頂上に登ってパリの壮大なパノラマビューを楽しみ、毎晩6時30分に無名戦士の墓で行われる追悼式に参加し、12本の放射状大通りが形成する星型パターンを観察してください。',
        historicalInfo: '凱旋門は1806年にナポレオンがフランス軍を称えるために委託しました。シャルル・ド・ゴール広場の中心にあり、無名戦士の墓があります。',
        yearBuilt: '1806-1836年',
        architect: 'ジャン・シャルグラン'
      },
      pt: {
        name: 'Arco do Triunfo',
        narration: 'O Arco do Triunfo homenageia aqueles que lutaram pela França. Está no centro da Place Charles de Gaulle.',
        description: 'Um dos monumentos mais famosos de Paris',
        historicalInfo: 'O Arco do Triunfo foi encomendado por Napoleão em 1806 para homenagear o exército francês. Está no centro da Place Charles de Gaulle e contém o Túmulo do Soldado Desconhecido.',
        yearBuilt: '1806-1836',
        architect: 'Jean Chalgrin'
      },
      ru: {
        name: 'Триумфальная арка',
        narration: 'Триумфальная арка чествует тех, кто сражался за Францию. Она стоит в центре площади Шарля де Голля.',
        description: 'Один из самых известных памятников Парижа',
        historicalInfo: 'Триумфальная арка была заказана Наполеоном в 1806 году в честь французской армии. Она находится в центре площади Шарля де Голля и содержит Могилу Неизвестного солдата.',
        yearBuilt: '1806-1836',
        architect: 'Жан Шальгрен'
      }
    }
  },
  {
    id: 'sacre_coeur',
    cityId: 'paris',
    name: 'Sacré-Cœur Basilica',
    lat: 48.886452,
    lng: 2.343121,
    radius: 60,
    narration: 'Welcome to the Sacré-Cœur Basilica, the white-domed church atop Montmartre hill. This Romano-Byzantine basilica offers stunning panoramic views of Paris.',
    description: 'Iconic white basilica atop Montmartre with panoramic city views',
    category: 'Religious Site',
    detailedDescription: 'The Basilica of the Sacred Heart of Paris, commonly known as Sacré-Cœur Basilica, stands as one of Paris\'s most recognizable landmarks, its brilliant white Romano-Byzantine domes crowning the summit of Montmartre, the highest point in the city. Perched 130 meters above sea level, the basilica offers breathtaking panoramic views across Paris, making it both a spiritual destination and a beloved viewpoint for millions of visitors annually. The origins of Sacré-Cœur are deeply intertwined with France\'s tumultuous history of the late 19th century. Following France\'s defeat in the Franco-Prussian War (1870-1871) and the bloody Paris Commune uprising, Catholic groups proposed building a church dedicated to the Sacred Heart of Jesus as an act of penance and national reconciliation. The basilica\'s construction was funded entirely by public subscription, with millions of French Catholics contributing to what they saw as a monument of moral and spiritual renewal for France.',
    photos: [
      'https://images.unsplash.com/photo-1594396874925-f61c20c0c2a9?w=800',
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
      'https://images.unsplash.com/photo-1572099606236-18839d6e4f09?w=800'
    ],
    historicalInfo: 'The Sacré-Cœur Basilica was built between 1875 and 1914 as a symbol of hope and penance after the Franco-Prussian War. Its distinctive white travertine stone perpetually maintains its brilliant appearance.',
    yearBuilt: '1875-1914',
    architect: 'Paul Abadie',
    translations: {
      en: {
        name: 'Sacré-Cœur Basilica',
        narration: 'Welcome to the Sacré-Cœur Basilica, the white-domed church atop Montmartre hill. This Romano-Byzantine basilica offers stunning panoramic views of Paris.',
        description: 'Iconic white basilica atop Montmartre with panoramic city views',
        historicalInfo: 'The Sacré-Cœur Basilica was built between 1875 and 1914 as a symbol of hope and penance after the Franco-Prussian War.',
        yearBuilt: '1875-1914',
        architect: 'Paul Abadie'
      },
      it: {
        name: 'Basilica del Sacro Cuore',
        narration: 'Benvenuti alla Basilica del Sacro Cuore, la chiesa dalla cupola bianca in cima alla collina di Montmartre. Questa basilica romano-bizantina offre una vista panoramica mozzafiato di Parigi.',
        description: 'Iconica basilica bianca in cima a Montmartre con vista panoramica sulla città',
        historicalInfo: 'La Basilica del Sacro Cuore fu costruita tra il 1875 e il 1914 come simbolo di speranza e penitenza dopo la guerra franco-prussiana.',
        yearBuilt: '1875-1914',
        architect: 'Paul Abadie'
      },
      ko: {
        name: '사크레쾨르 대성당',
        narration: '몽마르트르 언덕 꼭대기에 있는 하얀 돔의 교회, 사크레쾨르 대성당에 오신 것을 환영합니다. 이 로마-비잔틴 양식의 대성당은 파리의 멋진 파노라마 전망을 제공합니다.',
        description: '파리 시내 전망을 제공하는 몽마르트르 정상의 상징적인 하얀 대성당',
        historicalInfo: '사크레쾨르 대성당은 프랑스-프로이센 전쟁 이후 희망과 참회의 상징으로 1875년부터 1914년 사이에 건설되었습니다.',
        yearBuilt: '1875-1914년',
        architect: '폴 아바디'
      }
    }
  },
  {
    id: 'versailles',
    cityId: 'paris',
    name: 'Palace of Versailles',
    lat: 48.804865,
    lng: 2.120355,
    radius: 100,
    narration: 'Welcome to the Palace of Versailles, the opulent royal château that epitomizes the absolute power of French monarchy. This UNESCO World Heritage site was the principal residence of Louis XIV.',
    description: 'Magnificent royal palace and gardens, symbol of absolute monarchy',
    category: 'Palace',
    detailedDescription: 'The Palace of Versailles stands as perhaps the most magnificent symbol of absolute monarchy in European history, a sprawling testament to the power, wealth, and artistic ambition of France\'s ancien régime. Located approximately 20 kilometers southwest of Paris, this colossal palace complex encompasses the main château, extensive gardens, smaller palaces including the Grand and Petit Trianon, and the famous Hall of Mirrors, all set within an estate covering 800 hectares (2,000 acres). What began as a modest hunting lodge built by Louis XIII in 1623 was transformed by his son, Louis XIV (the Sun King), into the most spectacular palace in Europe and the seat of political power in France from 1682 until the French Revolution in 1789.',
    photos: [
      'https://images.unsplash.com/photo-1544531586-fdf09a217f25?w=800',
      'https://images.unsplash.com/photo-1604924413347-a8c0e20e6635?w=800',
      'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=800'
    ],
    historicalInfo: 'The Palace of Versailles was the principal royal residence of France from 1682 under Louis XIV until the start of the French Revolution in 1789. It became a symbol of the absolute monarchy of the Ancien Régime.',
    yearBuilt: '1623-1710',
    architect: 'Louis Le Vau, Jules Hardouin-Mansart, André Le Nôtre (gardens)',
    translations: {
      en: {
        name: 'Palace of Versailles',
        narration: 'Welcome to the Palace of Versailles, the opulent royal château that epitomizes the absolute power of French monarchy. This UNESCO World Heritage site was the principal residence of Louis XIV.',
        description: 'Magnificent royal palace and gardens, symbol of absolute monarchy',
        historicalInfo: 'The Palace of Versailles was the principal royal residence of France from 1682 under Louis XIV until the start of the French Revolution in 1789.',
        yearBuilt: '1623-1710',
        architect: 'Louis Le Vau, Jules Hardouin-Mansart, André Le Nôtre (gardens)'
      },
      it: {
        name: 'Reggia di Versailles',
        narration: 'Benvenuti alla Reggia di Versailles, lo sfarzoso castello reale che incarna il potere assoluto della monarchia francese. Questo sito UNESCO fu la residenza principale di Luigi XIV.',
        description: 'Magnifico palazzo reale e giardini, simbolo della monarchia assoluta',
        historicalInfo: 'La Reggia di Versailles fu la residenza reale principale della Francia dal 1682 sotto Luigi XIV fino all\'inizio della Rivoluzione francese nel 1789.',
        yearBuilt: '1623-1710',
        architect: 'Louis Le Vau, Jules Hardouin-Mansart, André Le Nôtre (giardini)'
      },
      ko: {
        name: '베르사유 궁전',
        narration: '프랑스 군주제의 절대 권력을 상징하는 호화로운 왕궁, 베르사유 궁전에 오신 것을 환영합니다. 이 유네스코 세계문화유산은 루이 14세의 주요 거주지였습니다.',
        description: '절대 군주제의 상징인 웅장한 왕궁과 정원',
        historicalInfo: '베르사유 궁전은 1682년 루이 14세 치하부터 1789년 프랑스 혁명이 시작될 때까지 프랑스의 주요 왕실 거주지였습니다.',
        yearBuilt: '1623-1710년',
        architect: '루이 르 보, 줄 아르두앵-망사르, 앙드레 르 노트르 (정원)'
      }
    }
  },
  {
    id: 'musee_dorsay',
    cityId: 'paris',
    name: 'Musée d\'Orsay',
    lat: 48.86,
    lng: 2.326561,
    radius: 60,
    narration: 'Welcome to the Musée d\'Orsay, housed in a stunning Beaux-Arts railway station. This museum holds the world\'s finest collection of Impressionist and Post-Impressionist masterpieces.',
    description: 'World-renowned museum of Impressionist and Post-Impressionist art',
    category: 'Museum',
    detailedDescription: 'The Musée d\'Orsay stands as one of the world\'s greatest art museums, housed in the spectacular former Gare d\'Orsay railway station on the Left Bank of the Seine. This magnificent Beaux-Arts building, with its soaring glass-roofed hall and ornate façade, provides a breathtaking setting for what is widely considered the world\'s finest collection of Impressionist and Post-Impressionist art. The museum\'s collection spans the years 1848 to 1914, bridging the gap between the Louvre\'s classical collections and the Centre Pompidou\'s modern art, and includes masterworks by Monet, Renoir, Degas, Van Gogh, Cézanne, and countless other luminaries of 19th and early 20th-century art.',
    photos: [
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
      'https://images.unsplash.com/photo-1591289009723-aef0a1a8a211?w=800',
      'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800'
    ],
    historicalInfo: 'Originally built as a railway station for the 1900 Exposition Universelle, the Gare d\'Orsay was converted into a museum in 1986, showcasing French art from 1848 to 1914.',
    yearBuilt: 'Station: 1900, Museum: 1986',
    architect: 'Victor Laloux (station), Gae Aulenti (museum conversion)',
    translations: {
      en: {
        name: 'Musée d\'Orsay',
        narration: 'Welcome to the Musée d\'Orsay, housed in a stunning Beaux-Arts railway station. This museum holds the world\'s finest collection of Impressionist and Post-Impressionist masterpieces.',
        description: 'World-renowned museum of Impressionist and Post-Impressionist art',
        historicalInfo: 'Originally built as a railway station for the 1900 Exposition Universelle, the Gare d\'Orsay was converted into a museum in 1986.',
        yearBuilt: 'Station: 1900, Museum: 1986',
        architect: 'Victor Laloux (station), Gae Aulenti (museum conversion)'
      },
      it: {
        name: 'Museo d\'Orsay',
        narration: 'Benvenuti al Museo d\'Orsay, ospitato in una splendida stazione ferroviaria Beaux-Arts. Questo museo custodisce la più bella collezione al mondo di capolavori impressionisti e post-impressionisti.',
        description: 'Museo di fama mondiale di arte impressionista e post-impressionista',
        historicalInfo: 'Originariamente costruita come stazione ferroviaria per l\'Esposizione Universale del 1900, la Gare d\'Orsay fu convertita in museo nel 1986.',
        yearBuilt: 'Stazione: 1900, Museo: 1986',
        architect: 'Victor Laloux (stazione), Gae Aulenti (conversione museo)'
      },
      ko: {
        name: '오르세 미술관',
        narration: '멋진 보자르 양식 기차역에 자리한 오르세 미술관에 오신 것을 환영합니다. 이 박물관은 세계 최고의 인상파 및 후기 인상파 걸작 컬렉션을 보유하고 있습니다.',
        description: '인상파 및 후기 인상파 미술의 세계적으로 유명한 박물관',
        historicalInfo: '1900년 만국박람회를 위해 기차역으로 건설된 가르 도르세는 1986년에 박물관으로 전환되었습니다.',
        yearBuilt: '역사: 1900년, 박물관: 1986년',
        architect: '빅토르 랄루 (역사), 가에 아울렌티 (박물관 개조)'
      }
    }
  },
  // London landmarks
  {
    id: 'big_ben',
    cityId: 'london',
    name: 'Big Ben',
    lat: 51.500786,
    lng: -0.124681,
    radius: 50,
    narration: 'Welcome to Big Ben, the iconic clock tower of London. Officially known as Elizabeth Tower, its chimes are known worldwide.',
    description: 'The Great Clock of Westminster',
    category: 'Monument',
    detailedDescription: 'Big Ben, one of the world\'s most recognizable landmarks, stands as an enduring symbol of London, British parliamentary democracy, and the precision of Victorian engineering. While "Big Ben" technically refers only to the Great Bell within the tower, the name has become synonymous with the entire Elizabeth Tower at the Palace of Westminster. Rising 96 meters (316 feet) above the Thames, this iconic clock tower has marked time over London since 1859, its distinctive chimes broadcast worldwide as the audio signature of British culture and news programming. The tower was designed by Augustus Pugin in the Gothic Revival style as part of the new Palace of Westminster, built after the devastating fire of 1834 destroyed the previous medieval palace. Construction began in 1843, but the tower was not completed until 1859, with the clock becoming operational on May 31 of that year. The first chimes of Big Ben rang out on July 11, 1859, though the bell cracked shortly after and was silent for four years while repairs were made. The repaired bell, with its distinctive tone created by the crack, began chiming again in 1863 and has continued to this day. The Elizabeth Tower (renamed from Clock Tower in 2012 to celebrate Queen Elizabeth II\'s Diamond Jubilee) showcases spectacular Gothic Revival architecture with its ornate stonework, pointed arches, and decorative cast iron spire topped with the cross of St. George. The tower contains 11 floors, with 334 steps spiraling up to the belfry and a further 59 steps to reach the Ayrton Light at the very top - a lantern that illuminates whenever either House of Parliament is sitting after dark. The Clock Tower houses the Great Clock, designed by Edmund Beckett Denison and built by clockmaker Edward John Dent. When it was completed, it was the largest and most accurate four-faced striking and chiming clock in the world. Each of the four clock faces measures 7 meters (23 feet) in diameter, with minute hands 4.3 meters (14 feet) long and hour hands 2.7 meters (9 feet) long. The clock mechanism, despite its Victorian origins, remains remarkably accurate, kept within two seconds of Greenwich Mean Time. The clock\'s precision is so valued that when the tower tilts slightly (it currently leans about 0.26 degrees), engineers carefully monitor to ensure it doesn\'t affect timekeeping. The tower contains five bells: the four quarter bells that chime every fifteen minutes, and the Great Bell - Big Ben itself - which strikes the hours. Big Ben weighs 13.7 tons and sounds the note E. The origin of the bell\'s name remains disputed; it may honor Sir Benjamin Hall, the Chief Commissioner of Works when the bell was installed, or Benjamin Caunt, a heavyweight boxing champion of the era. The quarter bells play the Westminster Quarters, a melody so famous it has been adopted by clock towers and grandfather clocks worldwide. The melody is based on variations of phrases from Handel\'s Messiah and is often followed by the striking of Big Ben on the hour. Big Ben has witnessed and marked some of Britain\'s most significant historical moments. During World War I, the chimes were silenced to prevent German zeppelins from using them for navigation, and the clock face lights were dimmed. In World War II, the tower suffered bomb damage but continued to keep time. On VE Day in 1945, the silenced bells rang out again to celebrate victory in Europe, their chimes representing the return of peace and normalcy. The clock stopped briefly on D-Day, creating rumors of sabotage, though it was likely a mechanical issue. Throughout the years, the clock has occasionally stopped or been silenced for various reasons. It ceased during Winston Churchill\'s funeral in 1965 and Margaret Thatcher\'s in 2013 as marks of respect. Mechanical failures have occurred, including a memorable incident in 1976 when the clock stopped for nine months due to metal fatigue. In 2007, a flock of starlings landing on a minute hand slowed the clock by several minutes. Big Ben has become a cultural icon appearing in countless films, from Peter Pan to V for Vendetta, where it serves as the ultimate symbol of London. The tower\'s image graces postcards, souvenirs, and media worldwide. Its chimes introduce BBC news broadcasts, making them perhaps the most recognized sound in broadcasting history. The "bongs" of Big Ben mark significant national moments, from New Year celebrations broadcast globally to moments of silence for national tragedies. From 2017 to 2021, Big Ben underwent its most extensive conservation project in its history, costing £80 million. The restoration involved dismantling the clock mechanism, repairing the tower\'s stonework, regilding the clock faces, and upgrading facilities. During this period, the bell was largely silenced except for special occasions, causing consternation among Londoners who missed its familiar hourly presence in the city\'s soundscape. The restoration revealed fascinating historical details, including graffiti left by Victorian workers and damage from World War II bombing raids. The Elizabeth Tower is not regularly open to the public, with tours available only to UK residents who arrange visits through their Members of Parliament, making it one of London\'s most exclusive tourist experiences. Those fortunate enough to climb the tower experience a journey through British history, passing through the prison room (where unruly MPs were once held), the clock room with its magnificent Victorian mechanism, and the belfry where Big Ben and the quarter bells hang. The view from the top offers spectacular panoramas of London, though the constant presence of the clock machinery serves as a reminder that this is a working building, not merely a tourist attraction. Big Ben represents more than Victorian engineering triumph - it symbolizes continuity, democracy, and British resilience. Through wars, celebrations, tragedies, and triumphs, its chimes have provided a constant, reassuring presence. As London continues to evolve around it, Big Ben remains an unchanging reference point, its hourly chimes marking not just time but the passage of history itself. The tower stands as a testament to the skill of Victorian craftsmen, the enduring power of Gothic architecture, and the human need for landmarks that connect us to our past while guiding us into the future.',
    photos: [
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800',
      'https://images.unsplash.com/photo-1543716021-36e0f757e6c9?w=800'
    ],
    historicalInfo: 'Big Ben is the nickname for the Great Bell of the clock at the Palace of Westminster. The tower was completed in 1859 and has become one of the most prominent symbols of the United Kingdom.',
    yearBuilt: '1843-1859',
    architect: 'Augustus Pugin',
    translations: {
      en: {
        name: 'Big Ben',
        narration: 'Welcome to Big Ben, the iconic clock tower of London. Officially known as Elizabeth Tower, its chimes are known worldwide.',
        description: 'The Great Clock of Westminster',
        detailedDescription: 'Big Ben, one of the world\'s most recognizable landmarks, stands as an enduring symbol of London, British parliamentary democracy, and the precision of Victorian engineering. While "Big Ben" technically refers only to the Great Bell within the tower, the name has become synonymous with the entire Elizabeth Tower at the Palace of Westminster. Rising 96 meters (316 feet) above the Thames, this iconic clock tower has marked time over London since 1859, its distinctive chimes broadcast worldwide as the audio signature of British culture and news programming. The tower was designed by Augustus Pugin in the Gothic Revival style as part of the new Palace of Westminster, built after the devastating fire of 1834 destroyed the previous medieval palace. Construction began in 1843, but the tower was not completed until 1859, with the clock becoming operational on May 31 of that year. The first chimes of Big Ben rang out on July 11, 1859, though the bell cracked shortly after and was silent for four years while repairs were made. The repaired bell, with its distinctive tone created by the crack, began chiming again in 1863 and has continued to this day. The Elizabeth Tower (renamed from Clock Tower in 2012 to celebrate Queen Elizabeth II\'s Diamond Jubilee) showcases spectacular Gothic Revival architecture with its ornate stonework, pointed arches, and decorative cast iron spire topped with the cross of St. George. The tower contains 11 floors, with 334 steps spiraling up to the belfry and a further 59 steps to reach the Ayrton Light at the very top - a lantern that illuminates whenever either House of Parliament is sitting after dark. The Clock Tower houses the Great Clock, designed by Edmund Beckett Denison and built by clockmaker Edward John Dent. When it was completed, it was the largest and most accurate four-faced striking and chiming clock in the world. Each of the four clock faces measures 7 meters (23 feet) in diameter, with minute hands 4.3 meters (14 feet) long and hour hands 2.7 meters (9 feet) long. The clock mechanism, despite its Victorian origins, remains remarkably accurate, kept within two seconds of Greenwich Mean Time. The clock\'s precision is so valued that when the tower tilts slightly (it currently leans about 0.26 degrees), engineers carefully monitor to ensure it doesn\'t affect timekeeping. The tower contains five bells: the four quarter bells that chime every fifteen minutes, and the Great Bell - Big Ben itself - which strikes the hours. Big Ben weighs 13.7 tons and sounds the note E. The origin of the bell\'s name remains disputed; it may honor Sir Benjamin Hall, the Chief Commissioner of Works when the bell was installed, or Benjamin Caunt, a heavyweight boxing champion of the era. The quarter bells play the Westminster Quarters, a melody so famous it has been adopted by clock towers and grandfather clocks worldwide. The melody is based on variations of phrases from Handel\'s Messiah and is often followed by the striking of Big Ben on the hour. Big Ben has witnessed and marked some of Britain\'s most significant historical moments. During World War I, the chimes were silenced to prevent German zeppelins from using them for navigation, and the clock face lights were dimmed. In World War II, the tower suffered bomb damage but continued to keep time. On VE Day in 1945, the silenced bells rang out again to celebrate victory in Europe, their chimes representing the return of peace and normalcy. The clock stopped briefly on D-Day, creating rumors of sabotage, though it was likely a mechanical issue. Throughout the years, the clock has occasionally stopped or been silenced for various reasons. It ceased during Winston Churchill\'s funeral in 1965 and Margaret Thatcher\'s in 2013 as marks of respect. Mechanical failures have occurred, including a memorable incident in 1976 when the clock stopped for nine months due to metal fatigue. In 2007, a flock of starlings landing on a minute hand slowed the clock by several minutes. Big Ben has become a cultural icon appearing in countless films, from Peter Pan to V for Vendetta, where it serves as the ultimate symbol of London. The tower\'s image graces postcards, souvenirs, and media worldwide. Its chimes introduce BBC news broadcasts, making them perhaps the most recognized sound in broadcasting history. The "bongs" of Big Ben mark significant national moments, from New Year celebrations broadcast globally to moments of silence for national tragedies. From 2017 to 2021, Big Ben underwent its most extensive conservation project in its history, costing £80 million. The restoration involved dismantling the clock mechanism, repairing the tower\'s stonework, regilding the clock faces, and upgrading facilities. During this period, the bell was largely silenced except for special occasions, causing consternation among Londoners who missed its familiar hourly presence in the city\'s soundscape. The restoration revealed fascinating historical details, including graffiti left by Victorian workers and damage from World War II bombing raids. The Elizabeth Tower is not regularly open to the public, with tours available only to UK residents who arrange visits through their Members of Parliament, making it one of London\'s most exclusive tourist experiences. Those fortunate enough to climb the tower experience a journey through British history, passing through the prison room (where unruly MPs were once held), the clock room with its magnificent Victorian mechanism, and the belfry where Big Ben and the quarter bells hang. The view from the top offers spectacular panoramas of London, though the constant presence of the clock machinery serves as a reminder that this is a working building, not merely a tourist attraction. Big Ben represents more than Victorian engineering triumph - it symbolizes continuity, democracy, and British resilience. Through wars, celebrations, tragedies, and triumphs, its chimes have provided a constant, reassuring presence. As London continues to evolve around it, Big Ben remains an unchanging reference point, its hourly chimes marking not just time but the passage of history itself. The tower stands as a testament to the skill of Victorian craftsmen, the enduring power of Gothic architecture, and the human need for landmarks that connect us to our past while guiding us into the future.'
      },
      it: {
        name: 'Big Ben',
        narration: 'Benvenuto al Big Ben, l\'iconica torre dell\'orologio di Londra. Ufficialmente conosciuta come Elizabeth Tower, i suoi rintocchi sono noti in tutto il mondo.',
        description: 'Il Grande Orologio di Westminster',
        historicalInfo: 'Big Ben è il soprannome della Grande Campana dell\'orologio del Palazzo di Westminster. La torre fu completata nel 1859 ed è diventata uno dei simboli più importanti del Regno Unito.',
        yearBuilt: '1843-1859',
        architect: 'Augustus Pugin'
      },
      ko: {
        name: '빅벤',
        narration: '런던의 상징적인 시계탑 빅벤에 오신 것을 환영합니다. 공식적으로 엘리자베스 타워로 알려져 있으며, 그 종소리는 전 세계적으로 유명합니다.',
        description: '웨스트민스터의 대시계',
        detailedDescription: '빅벤은 세계에서 가장 잘 알려진 랜드마크 중 하나로, 런던, 영국 의회 민주주의, 그리고 빅토리아 시대 공학의 정밀함을 상징하는 지속적인 상징입니다. 기술적으로 "빅벤"은 탑 내부의 대종만을 가리키지만, 이 이름은 웨스트민스터 궁전의 전체 엘리자베스 타워와 동의어가 되었습니다. 템스강 위로 96미터(316피트) 높이로 솟아 있는 이 상징적인 시계탑은 1859년부터 런던의 시간을 알려왔으며, 그 독특한 종소리는 영국 문화와 뉴스 방송의 청각적 상징으로 전 세계에 방송되고 있습니다. 이 탑은 아우구스투스 퓨진이 고딕 리바이벌 양식으로 설계했으며, 1834년 대화재로 파괴된 이전 중세 궁전을 대체하기 위해 건설된 새로운 웨스트민스터 궁전의 일부입니다. 건설은 1843년에 시작되었지만 탑은 1859년까지 완공되지 않았으며, 시계는 그해 5월 31일에 작동을 시작했습니다. 빅벤의 첫 종소리는 1859년 7월 11일에 울렸지만, 종은 곧 금이 갔고 수리를 위해 4년간 침묵했습니다. 금으로 인해 만들어진 독특한 음색을 가진 수리된 종은 1863년에 다시 울리기 시작했으며 오늘날까지 계속되고 있습니다. 관광 팁: 탑 꼭대기까지 334개의 계단을 올라가 런던의 장엄한 파노라마 전망을 감상하고(사전 예약 필수), 매시 정각 유명한 종소리를 들으며, 의회가 야간 회의 중일 때 탑 꼭대기의 아이튼 라이트가 켜지는 것을 관찰하세요.',
        historicalInfo: '빅벤은 웨스트민스터 궁전의 시계탑에 있는 대종의 별명입니다. 이 탑은 1859년에 완공되었으며 영국의 가장 중요한 상징 중 하나가 되었습니다.',
        yearBuilt: '1843-1859',
        architect: '아우구스투스 퓨진'
      },
      es: {
        name: 'Big Ben',
        narration: 'Bienvenido al Big Ben, la icónica torre del reloj de Londres. Conocida oficialmente como Elizabeth Tower, sus campanadas son conocidas en todo el mundo.',
        description: 'El Gran Reloj de Westminster',
        historicalInfo: 'Big Ben es el apodo de la Gran Campana del reloj del Palacio de Westminster. La torre se completó en 1859 y se ha convertido en uno de los símbolos más destacados del Reino Unido.',
        yearBuilt: '1843-1859',
        architect: 'Augustus Pugin'
      },
      fr: {
        name: 'Big Ben',
        narration: 'Bienvenue à Big Ben, la tour de l\'horloge emblématique de Londres. Officiellement connue sous le nom d\'Elizabeth Tower, ses carillons sont connus dans le monde entier.',
        description: 'La Grande Horloge de Westminster',
        historicalInfo: 'Big Ben est le surnom de la Grande Cloche de l\'horloge du Palais de Westminster. La tour a été achevée en 1859 et est devenue l\'un des symboles les plus importants du Royaume-Uni.',
        yearBuilt: '1843-1859',
        architect: 'Augustus Pugin'
      },
      de: {
        name: 'Big Ben',
        narration: 'Willkommen am Big Ben, dem ikonischen Glockenturm Londons. Offiziell als Elizabeth Tower bekannt, sind seine Glockenschläge weltweit bekannt.',
        description: 'Die Große Uhr von Westminster',
        historicalInfo: 'Big Ben ist der Spitzname für die Große Glocke der Uhr im Palace of Westminster. Der Turm wurde 1859 fertiggestellt und ist zu einem der bekanntesten Symbole des Vereinigten Königreichs geworden.',
        yearBuilt: '1843-1859',
        architect: 'Augustus Pugin'
      },
      zh: {
        name: '大本钟',
        narration: '欢迎来到大本钟，伦敦标志性的钟楼。正式名称为伊丽莎白塔，其钟声享誉全球。',
        description: '威斯敏斯特大钟',
        detailedDescription: '大本钟是世界上最知名的地标之一，作为伦敦、英国议会民主制和维多利亚时代工程精密性的持久象征。虽然"大本钟"在技术上仅指塔内的大钟，但这个名字已成为威斯敏斯特宫整个伊丽莎白塔的代名词。这座标志性钟楼高耸于泰晤士河上方96米（316英尺），自1859年以来一直为伦敦报时，其独特的钟声作为英国文化和新闻广播的音频标志向全世界播放。该塔由奥古斯塔斯·普金设计，采用哥特复兴风格，是新威斯敏斯特宫的一部分，该宫殿是在1834年大火摧毁之前的中世纪宫殿后建造的。建设始于1843年，但直到1859年才完工，时钟于当年5月31日开始运行。大本钟的第一次钟声在1859年7月11日响起，尽管钟很快就裂了，并在修复期间沉默了四年。修复后的钟具有裂纹造成的独特音色，于1863年再次开始鸣响，并一直持续到今天。伊丽莎白塔（2012年从钟楼更名，以纪念伊丽莎白二世女王的钻禧年）展示了壮观的哥特复兴建筑，其华丽的石雕、尖拱和装饰性铸铁尖顶，顶部是圣乔治十字架。参观提示：攀登334级台阶至塔顶欣赏伦敦壮丽全景（需提前预订），每小时整点聆听著名钟声，观察议会夜间开会时塔顶的艾尔顿灯亮起。',
        historicalInfo: '大本钟是威斯敏斯特宫钟楼大钟的昵称。该塔于1859年完工，已成为英国最重要的象征之一。',
        yearBuilt: '1843-1859',
        architect: '奥古斯塔斯·普金'
      },
      ja: {
        name: 'ビッグ・ベン',
        narration: 'ロンドンの象徴的な時計塔、ビッグ・ベンへようこそ。正式にはエリザベス・タワーとして知られ、その鐘の音は世界中で知られています。',
        description: 'ウェストミンスターの大時計',
        detailedDescription: 'ビッグ・ベンは世界で最も認知度の高いランドマークの一つであり、ロンドン、イギリス議会民主主義、そしてビクトリア朝工学の精密さの永続的なシンボルとして立っています。技術的には「ビッグ・ベン」は塔内の大鐘のみを指しますが、この名前はウェストミンスター宮殿全体のエリザベス・タワーと同義語になっています。テムズ川の上96メートル（316フィート）にそびえ立つこの象徴的な時計塔は、1859年以来ロンドンの時を刻んでおり、その独特の鐘の音はイギリス文化とニュース放送の音声シグネチャーとして世界中に放送されています。この塔はオーガスタス・ピュージンによってゴシック・リバイバル様式で設計され、1834年の大火で破壊された以前の中世宮殿の後に建てられた新しいウェストミンスター宮殿の一部です。建設は1843年に始まりましたが、塔は1859年まで完成せず、時計はその年の5月31日に稼働を始めました。ビッグ・ベンの最初の鐘の音は1859年7月11日に鳴り響きましたが、鐘はすぐにひび割れ、修理のために4年間沈黙しました。ひび割れによって作られた独特の音色を持つ修理された鐘は1863年に再び鳴り始め、今日まで続いています。エリザベス・タワー（2012年にクロック・タワーからエリザベス2世女王のダイヤモンド・ジュビリーを記念して改名）は、装飾的な石細工、尖頭アーチ、そして聖ジョージの十字架で頂上を飾られた装飾的な鋳鉄の尖塔を持つ壮大なゴシック・リバイバル建築を示しています。訪問のヒント：塔の頂上まで334段の階段を登ってロンドンの壮大なパノラマビューを楽しみ（事前予約が必要）、毎時の有名な鐘の音を聞き、議会が夜間に開催されているときに塔の頂上のエアトン・ライトが点灯するのを観察してください。',
        historicalInfo: 'ビッグ・ベンはウェストミンスター宮殿の時計塔にある大鐘の愛称です。この塔は1859年に完成し、イギリスの最も重要なシンボルの一つとなりました。',
        yearBuilt: '1843-1859',
        architect: 'オーガスタス・ピュージン'
      },
      pt: {
        name: 'Big Ben',
        narration: 'Bem-vindo ao Big Ben, a icônica torre do relógio de Londres. Oficialmente conhecida como Torre Elizabeth, seus sinos são conhecidos mundialmente.',
        description: 'O Grande Relógio de Westminster',
        historicalInfo: 'Big Ben é o apelido do Grande Sino do relógio do Palácio de Westminster. A torre foi concluída em 1859 e se tornou um dos símbolos mais proeminentes do Reino Unido.',
        yearBuilt: '1843-1859',
        architect: 'Augustus Pugin'
      },
      ru: {
        name: 'Биг-Бен',
        narration: 'Добро пожаловать в Биг-Бен, знаковую часовую башню Лондона. Официально известная как башня Елизаветы, ее колокольные звоны известны во всем мире.',
        description: 'Большие часы Вестминстера',
        historicalInfo: 'Биг-Бен — это прозвище Большого колокола часов Вестминстерского дворца. Башня была завершена в 1859 году и стала одним из самых важных символов Соединенного Королевства.',
        yearBuilt: '1843-1859',
        architect: 'Огастес Пьюджин'
      }
    }
  },
  {
    id: 'tower_bridge',
    cityId: 'london',
    name: 'Tower Bridge',
    lat: 51.5055,
    lng: -0.0753,
    radius: 60,
    narration: 'You are at Tower Bridge, one of London\'s most famous landmarks. This combined bascule and suspension bridge crosses the River Thames.',
    description: 'An iconic symbol of London since 1894',
    category: 'Bridge',
    detailedDescription: 'Tower Bridge, one of London\'s most recognizable landmarks, stands as a magnificent example of Victorian engineering ingenuity and Gothic Revival architecture. Spanning the River Thames near the Tower of London, this iconic combined bascule and suspension bridge has become synonymous with London itself, its distinctive twin towers and blue-painted suspension chains appearing in countless photographs, films, and artworks since its completion in 1894. The bridge\'s construction was necessitated by the massive commercial growth of the East End of London during the 19th century, which required a new river crossing east of London Bridge that wouldn\'t disrupt river traffic to the busy Pool of London docks. The challenge was unprecedented: how to build a bridge low enough for pedestrians and vehicles to cross easily, yet able to allow tall-masted ships to pass underneath. In 1876, the City of London Corporation formed a Special Bridge or Subway Committee to find a solution, receiving over 50 design proposals ranging from the practical to the fantastical. The winning design, submitted by Horace Jones, the City Architect, in collaboration with engineer John Wolfe Barry, ingeniously solved the problem with a bascule (seesaw) bridge whose roadway could be raised to allow ships to pass. Jones and Barry\'s Gothic Revival design featured two massive towers rising 65 meters (213 feet) above the Thames, connected at the upper level by two horizontal walkways designed to allow pedestrians to cross even when the bridge was raised. The towers were clad in Cornish granite and Portland stone to provide a pleasing appearance and to protect the steel framework beneath, creating a structure that appeared medieval while incorporating cutting-edge Victorian technology. Construction began in 1886 and employed 432 workers over eight years, tragically claiming the lives of 10 men during the dangerous work. The bridge required 70,000 tons of concrete to be sunk into the riverbed to support the massive structure. Over 11,000 tons of steel formed the framework, which was then clad in stone. The bascule mechanism was revolutionary for its time - two massive bascules (leaves), each weighing over 1,000 tons, could be raised to an angle of 83 degrees in just five minutes. Originally powered by steam, the hydraulic system used water pumped into accumulators by steam engines to move the bascules. The system was so well-designed that it required relatively little power to operate, with the massive counterweights doing much of the work. The high-level walkways, 42 meters (138 feet) above the Thames at high tide, quickly became popular with prostitutes and pickpockets rather than legitimate pedestrians, leading to their closure in 1910. They remained closed until 1982 when they reopened as part of the Tower Bridge Exhibition, now featuring glass floors offering thrilling views down to the river and road below. Tower Bridge was officially opened on June 30, 1894, by the Prince of Wales (the future King Edward VII) and his wife, Alexandra of Denmark. In its early years, the bridge was raised almost 50 times per day to allow ships to pass. Today, it still opens approximately 800 times per year, though the mechanism is now powered by electricity rather than steam. The bridge has been the scene of numerous daring incidents. In 1952, a double-decker bus found itself on the bridge as it began to open; driver Albert Gunter accelerated and jumped the growing gap, earning himself a £10 bonus for bravery. In 1968, Royal Air Force pilot Alan Pollock flew his Hawker Hunter jet through the bridge\'s towers as an unauthorized protest, threading his aircraft through the upper and lower spans. The bridge underwent major color changes over its history. Originally chocolate brown, it was repainted red, white, and blue for Queen Elizabeth II\'s Silver Jubilee in 1977. It was later repainted in the current blue and white color scheme that many consider iconic, though historians note it was never these colors originally. The Engine Rooms, located in the bridge\'s southern approach, house the original Victorian steam engines, accumulators, and boilers that once powered the bridge. These magnificent examples of Victorian engineering, built by Armstrong Mitchell & Company, have been preserved as a museum, allowing visitors to see the intricate machinery that made the bridge\'s operation possible. The engines, though no longer in use, remain in pristine condition, their brass fittings polished and copper pipes gleaming, offering a window into the industrial age. Tower Bridge has appeared in countless films, from "Spice World" to "Bridget Jones\'s Diary," and has been destroyed in numerous disaster movies, including "The Mummy Returns" and "Thor: The Dark World." It often appears incorrectly labeled as "London Bridge" in popular media, causing confusion between the two distinct structures. The bridge has become a symbol of London, appearing on souvenirs, postcards, and promotional materials worldwide. It plays a central role in London\'s major celebrations, including elaborate lighting displays for New Year\'s Eve, royal occasions, and the annual Lord Mayor\'s Show. The bridge is illuminated nightly, and special lighting schemes mark significant events - red and blue for royal celebrations, rainbow colors for Pride, and various national flags for visiting dignitaries. The Tower Bridge Exhibition, opened in 1982, allows visitors to explore the bridge\'s history and engineering while walking across the high-level walkways with their glass floors installed in 2014. The exhibition tells the story of the bridge\'s construction, its role in London\'s history, and the lives of the people who built and maintained it. Visitors can also watch the bridge lift from special viewing areas, experiencing the impressive sight of the massive bascules rising to allow tall ships through. In recent years, Tower Bridge has embraced modern technology while maintaining its Victorian character. LED lighting has replaced older systems, reducing energy consumption while allowing for more dramatic displays. The bridge has also become a focal point for sporting events, including the London Olympics and various marathons and charity events. Conservation work continues to preserve the structure for future generations, with ongoing maintenance of the stonework, steelwork, and mechanical systems. Tower Bridge represents more than Victorian engineering prowess - it symbolizes London\'s ability to blend the old with the new, tradition with innovation. It stands as a working bridge that still raises for river traffic while serving as one of the world\'s most visited tourist attractions. The bridge connects London\'s historic center with the modern developments of the South Bank and beyond, both physically and symbolically. As London continues to evolve, Tower Bridge remains a constant, its distinctive silhouette a reminder of the city\'s rich history and its ongoing journey into the future. The bridge proves that functional infrastructure can also be beautiful, that engineering can be art, and that the best monuments are those that continue to serve their communities while inspiring wonder and pride across generations.',
    photos: [
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
      'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=800',
      'https://images.unsplash.com/photo-1532178324009-6b6adeca1741?w=800'
    ],
    historicalInfo: 'Tower Bridge was built between 1886 and 1894 and is one of London\'s most famous landmarks. The bascule bridge mechanism allows the roadway to be raised to let river traffic pass underneath.',
    yearBuilt: '1886-1894',
    architect: 'Horace Jones and John Wolfe Barry',
    translations: {
      en: {
        name: 'Tower Bridge',
        narration: 'You are at Tower Bridge, one of London\'s most famous landmarks. This combined bascule and suspension bridge crosses the River Thames.',
        description: 'An iconic symbol of London since 1894',
        detailedDescription: 'Tower Bridge, one of London\'s most recognizable landmarks, stands as a magnificent example of Victorian engineering ingenuity and Gothic Revival architecture. Spanning the River Thames near the Tower of London, this iconic combined bascule and suspension bridge has become synonymous with London itself, its distinctive twin towers and blue-painted suspension chains appearing in countless photographs, films, and artworks since its completion in 1894. The bridge\'s construction was necessitated by the massive commercial growth of the East End of London during the 19th century, which required a new river crossing east of London Bridge that wouldn\'t disrupt river traffic to the busy Pool of London docks. The challenge was unprecedented: how to build a bridge low enough for pedestrians and vehicles to cross easily, yet able to allow tall-masted ships to pass underneath. In 1876, the City of London Corporation formed a Special Bridge or Subway Committee to find a solution, receiving over 50 design proposals ranging from the practical to the fantastical. The winning design, submitted by Horace Jones, the City Architect, in collaboration with engineer John Wolfe Barry, ingeniously solved the problem with a bascule (seesaw) bridge whose roadway could be raised to allow ships to pass. Jones and Barry\'s Gothic Revival design featured two massive towers rising 65 meters (213 feet) above the Thames, connected at the upper level by two horizontal walkways designed to allow pedestrians to cross even when the bridge was raised. The towers were clad in Cornish granite and Portland stone to provide a pleasing appearance and to protect the steel framework beneath, creating a structure that appeared medieval while incorporating cutting-edge Victorian technology. Construction began in 1886 and employed 432 workers over eight years, tragically claiming the lives of 10 men during the dangerous work. The bridge required 70,000 tons of concrete to be sunk into the riverbed to support the massive structure. Over 11,000 tons of steel formed the framework, which was then clad in stone. The bascule mechanism was revolutionary for its time - two massive bascules (leaves), each weighing over 1,000 tons, could be raised to an angle of 83 degrees in just five minutes. Originally powered by steam, the hydraulic system used water pumped into accumulators by steam engines to move the bascules. The system was so well-designed that it required relatively little power to operate, with the massive counterweights doing much of the work. The high-level walkways, 42 meters (138 feet) above the Thames at high tide, quickly became popular with prostitutes and pickpockets rather than legitimate pedestrians, leading to their closure in 1910. They remained closed until 1982 when they reopened as part of the Tower Bridge Exhibition, now featuring glass floors offering thrilling views down to the river and road below. Tower Bridge was officially opened on June 30, 1894, by the Prince of Wales (the future King Edward VII) and his wife, Alexandra of Denmark. In its early years, the bridge was raised almost 50 times per day to allow ships to pass. Today, it still opens approximately 800 times per year, though the mechanism is now powered by electricity rather than steam. The bridge has been the scene of numerous daring incidents. In 1952, a double-decker bus found itself on the bridge as it began to open; driver Albert Gunter accelerated and jumped the growing gap, earning himself a £10 bonus for bravery. In 1968, Royal Air Force pilot Alan Pollock flew his Hawker Hunter jet through the bridge\'s towers as an unauthorized protest, threading his aircraft through the upper and lower spans. The bridge underwent major color changes over its history. Originally chocolate brown, it was repainted red, white, and blue for Queen Elizabeth II\'s Silver Jubilee in 1977. It was later repainted in the current blue and white color scheme that many consider iconic, though historians note it was never these colors originally. The Engine Rooms, located in the bridge\'s southern approach, house the original Victorian steam engines, accumulators, and boilers that once powered the bridge. These magnificent examples of Victorian engineering, built by Armstrong Mitchell & Company, have been preserved as a museum, allowing visitors to see the intricate machinery that made the bridge\'s operation possible. The engines, though no longer in use, remain in pristine condition, their brass fittings polished and copper pipes gleaming, offering a window into the industrial age. Tower Bridge has appeared in countless films, from "Spice World" to "Bridget Jones\'s Diary," and has been destroyed in numerous disaster movies, including "The Mummy Returns" and "Thor: The Dark World." It often appears incorrectly labeled as "London Bridge" in popular media, causing confusion between the two distinct structures. The bridge has become a symbol of London, appearing on souvenirs, postcards, and promotional materials worldwide. It plays a central role in London\'s major celebrations, including elaborate lighting displays for New Year\'s Eve, royal occasions, and the annual Lord Mayor\'s Show. The bridge is illuminated nightly, and special lighting schemes mark significant events - red and blue for royal celebrations, rainbow colors for Pride, and various national flags for visiting dignitaries. The Tower Bridge Exhibition, opened in 1982, allows visitors to explore the bridge\'s history and engineering while walking across the high-level walkways with their glass floors installed in 2014. The exhibition tells the story of the bridge\'s construction, its role in London\'s history, and the lives of the people who built and maintained it. Visitors can also watch the bridge lift from special viewing areas, experiencing the impressive sight of the massive bascules rising to allow tall ships through. In recent years, Tower Bridge has embraced modern technology while maintaining its Victorian character. LED lighting has replaced older systems, reducing energy consumption while allowing for more dramatic displays. The bridge has also become a focal point for sporting events, including the London Olympics and various marathons and charity events. Conservation work continues to preserve the structure for future generations, with ongoing maintenance of the stonework, steelwork, and mechanical systems. Tower Bridge represents more than Victorian engineering prowess - it symbolizes London\'s ability to blend the old with the new, tradition with innovation. It stands as a working bridge that still raises for river traffic while serving as one of the world\'s most visited tourist attractions. The bridge connects London\'s historic center with the modern developments of the South Bank and beyond, both physically and symbolically. As London continues to evolve, Tower Bridge remains a constant, its distinctive silhouette a reminder of the city\'s rich history and its ongoing journey into the future. The bridge proves that functional infrastructure can also be beautiful, that engineering can be art, and that the best monuments are those that continue to serve their communities while inspiring wonder and pride across generations.'
      },
      it: {
        name: 'Tower Bridge',
        narration: 'Ti trovi al Tower Bridge, uno dei monumenti più famosi di Londra. Questo ponte basculante e sospeso attraversa il Tamigi.',
        description: 'Un simbolo iconico di Londra dal 1894',
        historicalInfo: 'Il Tower Bridge fu costruito tra il 1886 e il 1894 ed è uno dei monumenti più famosi di Londra. Il meccanismo del ponte basculante permette di sollevare la carreggiata per far passare il traffico fluviale.',
        yearBuilt: '1886-1894',
        architect: 'Horace Jones e John Wolfe Barry'
      },
      ko: {
        name: '타워 브리지',
        narration: '런던에서 가장 유명한 랜드마크 중 하나인 타워 브리지에 있습니다. 이 도개교와 현수교가 결합된 다리는 템스강을 가로지릅니다.',
        description: '1894년부터 런던의 상징',
        detailedDescription: '타워 브리지는 런던에서 가장 인식하기 쉬운 랜드마크 중 하나로, 빅토리아 시대 공학의 독창성과 고딕 리바이벌 건축의 웅장한 예입니다. 런던 타워 근처 템스강을 가로지르는 이 상징적인 도개교와 현수교의 결합은 1894년 완공 이래 런던 그 자체와 동의어가 되었으며, 독특한 쌍둥이 탑과 푸른색 현수 체인이 수많은 사진, 영화, 예술 작품에 등장했습니다. 다리의 건설은 19세기 런던 이스트 엔드의 대규모 상업적 성장에 의해 필요하게 되었으며, 런던 브리지 동쪽에 새로운 강 횡단이 필요했지만 런던 항구의 번화한 선박 교통을 방해하지 않아야 했습니다. 도시 건축가 호레이스 존스가 엔지니어 존 울프 배리와 협력하여 제출한 우승 디자인은 도로를 들어 올려 선박이 통과할 수 있는 도개교(시소 다리)로 이 문제를 독창적으로 해결했습니다. 존스와 배리의 고딕 리바이벌 디자인은 템스강 위로 65미터(213피트) 높이로 솟은 두 개의 거대한 탑을 특징으로 하며, 다리가 들어 올려졌을 때에도 보행자가 건널 수 있도록 상층에 두 개의 수평 보도로 연결되어 있습니다. 건설은 1886년에 시작되어 8년에 걸쳐 432명의 노동자를 고용했으며, 위험한 작업 중 비극적으로 10명의 생명을 앗아갔습니다. 방문 팁: 유리 바닥 보도에서 아래 템스강과 교통을 내려다보고, 빅토리아 시대 엔진룸을 방문하여 원래 증기 구동 메커니즘을 확인하며, 다리가 들어 올려지는 시간표를 확인하여 이 놀라운 공학적 위업을 직접 목격하세요.',
        historicalInfo: '타워 브리지는 1886년에서 1894년 사이에 건설되었으며 런던의 가장 유명한 랜드마크 중 하나입니다. 도개교 메커니즘은 강 교통이 아래를 통과할 수 있도록 도로를 들어 올릴 수 있게 합니다.',
        yearBuilt: '1886-1894',
        architect: '호레이스 존스와 존 울프 배리'
      },
      es: {
        name: 'Tower Bridge',
        narration: 'Está en Tower Bridge, uno de los monumentos más famosos de Londres. Este puente basculante y colgante cruza el río Támesis.',
        description: 'Un símbolo icónico de Londres desde 1894',
        historicalInfo: 'Tower Bridge fue construido entre 1886 y 1894 y es uno de los monumentos más famosos de Londres. El mecanismo del puente basculante permite que la calzada se eleve para dejar pasar el tráfico fluvial.',
        yearBuilt: '1886-1894',
        architect: 'Horace Jones y John Wolfe Barry'
      },
      fr: {
        name: 'Tower Bridge',
        narration: 'Vous êtes au Tower Bridge, l\'un des monuments les plus célèbres de Londres. Ce pont basculant et suspendu traverse la Tamise.',
        description: 'Un symbole emblématique de Londres depuis 1894',
        historicalInfo: 'Le Tower Bridge a été construit entre 1886 et 1894 et est l\'un des monuments les plus célèbres de Londres. Le mécanisme du pont basculant permet de lever la chaussée pour laisser passer le trafic fluvial.',
        yearBuilt: '1886-1894',
        architect: 'Horace Jones et John Wolfe Barry'
      },
      de: {
        name: 'Tower Bridge',
        narration: 'Sie befinden sich an der Tower Bridge, einem der berühmtesten Wahrzeichen Londons. Diese kombinierte Klapp- und Hängebrücke überquert die Themse.',
        description: 'Ein ikonisches Symbol Londons seit 1894',
        historicalInfo: 'Die Tower Bridge wurde zwischen 1886 und 1894 erbaut und ist eines der berühmtesten Wahrzeichen Londons. Der Klappbrückenmechanismus ermöglicht es, die Fahrbahn anzuheben, um den Schiffsverkehr durchzulassen.',
        yearBuilt: '1886-1894',
        architect: 'Horace Jones und John Wolfe Barry'
      },
      zh: {
        name: '塔桥',
        narration: '您在伦敦最著名的地标之一塔桥。这座开合桥和悬索桥的组合横跨泰晤士河。',
        description: '自1894年以来伦敦的标志性象征',
        detailedDescription: '塔桥是伦敦最知名的地标之一，是维多利亚时代工程独创性和哥特复兴建筑的壮丽典范。这座标志性的开合桥和悬索桥组合横跨伦敦塔附近的泰晤士河，自1894年建成以来已成为伦敦的代名词，其独特的双塔和蓝色悬索链出现在无数照片、电影和艺术作品中。这座桥的建设是由19世纪伦敦东区大规模商业增长所必需的，需要在伦敦桥以东建一座新的过河通道，但又不能干扰伦敦港繁忙码头的河道交通。挑战前所未有：如何建造一座足够低的桥梁让行人和车辆轻松通过，同时又能让高桅杆船只从下面通过。市政建筑师霍勒斯·琼斯与工程师约翰·沃尔夫·巴里合作提交的获胜设计，巧妙地用开合桥（跷跷板式桥）解决了这个问题，其路面可以升起让船只通过。琼斯和巴里的哥特复兴设计有两座巨大的塔楼，高耸于泰晤士河上方65米（213英尺），上层用两条水平人行道连接，即使桥升起时也能让行人通过。建设于1886年开始，历时8年雇用了432名工人，在危险的工作中不幸夺去了10人的生命。参观提示：在玻璃地板人行道上俯瞰下方的泰晤士河和交通，参观维多利亚时代的发动机房查看原始蒸汽动力机制，查看桥梁升起时间表亲眼目睹这一惊人的工程壮举。',
        historicalInfo: '塔桥建于1886年至1894年间，是伦敦最著名的地标之一。开合桥机制允许路面升起以让河道交通通过。',
        yearBuilt: '1886-1894',
        architect: '霍勒斯·琼斯和约翰·沃尔夫·巴里'
      },
      ja: {
        name: 'タワーブリッジ',
        narration: 'ロンドンで最も有名なランドマークの一つ、タワーブリッジにいます。この跳ね橋と吊り橋を組み合わせた橋はテムズ川に架かっています。',
        description: '1894年以来のロンドンの象徴',
        detailedDescription: 'タワーブリッジはロンドンで最も認知度の高いランドマークの一つであり、ビクトリア朝工学の独創性とゴシック・リバイバル建築の壮大な例です。ロンドン塔近くのテムズ川に架かるこの象徴的な跳ね橋と吊り橋の組み合わせは、1894年の完成以来ロンドンそのものの同義語となり、独特の双子の塔と青く塗られた吊り鎖が無数の写真、映画、芸術作品に登場しています。この橋の建設は19世紀のロンドンのイーストエンドの大規模な商業成長によって必要とされ、ロンドン橋の東に新しい川の横断が必要でしたが、ロンドン港の忙しいドックへの河川交通を妨げないようにする必要がありました。課題は前例のないものでした：歩行者や車両が簡単に渡れるほど低く、かつ高いマストの船が下を通過できる橋をどのように建設するか。市の建築家ホレス・ジョーンズがエンジニアのジョン・ウルフ・バリーと協力して提出した優勝デザインは、船が通過できるように道路を持ち上げることができる跳ね橋（シーソー橋）でこの問題を独創的に解決しました。ジョーンズとバリーのゴシック・リバイバルデザインは、テムズ川の上65メートル（213フィート）にそびえる2つの巨大な塔を特徴とし、橋が上がっているときでも歩行者が渡れるように上層で2つの水平歩道で接続されています。建設は1886年に始まり、8年間で432人の労働者を雇用し、危険な作業中に悲劇的に10人の命を奪いました。訪問のヒント：ガラス床の歩道から下のテムズ川と交通を見下ろし、ビクトリア朝のエンジンルームを訪れて元の蒸気駆動メカニズムを確認し、橋が上がる時刻表をチェックしてこの驚くべき工学の偉業を直接目撃してください。',
        historicalInfo: 'タワーブリッジは1886年から1894年にかけて建設され、ロンドンで最も有名なランドマークの一つです。跳ね橋機構により、河川交通を通過させるために道路を持ち上げることができます。',
        yearBuilt: '1886-1894',
        architect: 'ホレス・ジョーンズとジョン・ウルフ・バリー'
      },
      pt: {
        name: 'Tower Bridge',
        narration: 'Você está na Tower Bridge, um dos marcos mais famosos de Londres. Esta ponte basculante e suspensa cruza o Rio Tâmisa.',
        description: 'Um símbolo icônico de Londres desde 1894',
        historicalInfo: 'A Tower Bridge foi construída entre 1886 e 1894 e é um dos marcos mais famosos de Londres. O mecanismo da ponte basculante permite que a pista seja levantada para deixar o tráfego fluvial passar por baixo.',
        yearBuilt: '1886-1894',
        architect: 'Horace Jones e John Wolfe Barry'
      },
      ru: {
        name: 'Тауэрский мост',
        narration: 'Вы находитесь у Тауэрского моста, одной из самых известных достопримечательностей Лондона. Этот разводной и подвесной мост пересекает Темзу.',
        description: 'Знаковый символ Лондона с 1894 года',
        historicalInfo: 'Тауэрский мост был построен между 1886 и 1894 годами и является одной из самых известных достопримечательностей Лондона. Механизм разводного моста позволяет поднимать проезжую часть для пропуска речного транспорта.',
        yearBuilt: '1886-1894',
        architect: 'Гораций Джонс и Джон Вулф Барри'
      }
    }
  },
  {
    id: 'buckingham_palace',
    cityId: 'london',
    name: 'Buckingham Palace',
    lat: 51.501476,
    lng: -0.140634,
    radius: 70,
    narration: 'This is Buckingham Palace, the London residence of the British monarch. Watch the famous Changing of the Guard ceremony.',
    description: 'The official residence of the British monarch',
    category: 'Palace',
    detailedDescription: 'Buckingham Palace, the London residence and administrative headquarters of the British monarch, stands as one of the world\'s most recognizable symbols of royalty, state power, and British national identity. Located in the City of Westminster, this magnificent palace serves not only as the Queen\'s official London residence but also as the venue for numerous state occasions, royal ceremonies, and official entertaining. With 775 rooms, including 19 State Rooms, 52 Royal and guest bedrooms, 188 staff bedrooms, 92 offices, and 78 bathrooms, Buckingham Palace is one of the largest and most complex working palaces in the world. The site\'s history as a royal residence began in 1761 when King George III acquired Buckingham House, a large townhouse built for the Duke of Buckingham in 1703, as a private residence for Queen Charlotte. The original house, designed by William Winde, was a relatively modest brick building, far from the grand palace we see today. George III and Charlotte raised 14 of their 15 children there, preferring its comfortable domestic setting to the formality of St. James\'s Palace. George III called it the Queen\'s House, and it remained a private royal residence for nearly 60 years. The transformation from private house to grand palace began in 1826 when King George IV commissioned architect John Nash to expand and rebuild the structure as a suitable royal palace. Nash\'s ambitious Neoclassical design created a three-sided courtyard facing The Mall, featuring Bath stone façades and a magnificent central dome. However, George IV died before the work was completed, and his brother William IV, who succeeded him, showed little interest in the project. It was Queen Victoria who first made Buckingham Palace the principal royal residence in 1837, shortly after her accession to the throne. Finding the palace too small for court life and her growing family, Victoria commissioned Edward Blore to build a new wing closing the open side of Nash\'s courtyard. This wing, facing The Mall, was completed in 1847 and included the famous balcony where the Royal Family gathers for major celebrations. The original entrance, Nash\'s Marble Arch, was moved to its current position at the northeast corner of Hyde Park. The palace facade that visitors see today, the principal face of the palace, was refaced in 1913 with Portland stone by architect Aston Webb, creating the iconic image of Buckingham Palace known worldwide. Webb\'s design provided a more dignified and monumental backdrop for royal ceremonies and state occasions. The central balcony, part of Blore\'s wing, has become the iconic stage for royal appearances during moments of national celebration, from VE Day in 1945 to royal weddings and jubilees. The State Rooms, opened to the public each summer, showcase some of the greatest treasures of the Royal Collection. The Grand Staircase, with its elaborate gilded bronze balustrade, leads visitors to the State Rooms, which include the Throne Room, used for formal photographs at royal weddings and investiture ceremonies; the Picture Gallery, a 47-meter long room displaying masterpieces by Rembrandt, Rubens, Vermeer, and Canaletto; the White Drawing Room, where the Royal Family gathers before state occasions; and the magnificent Ballroom, the largest room in the palace, used for state banquets and investitures. The Music Room, with its beautiful domed ceiling, has witnessed numerous royal christenings, including those of Prince Charles, Prince William, Prince George, Princess Charlotte, and Prince Louis. The Blue Drawing Room, with its magnificent ceiling design by Nash, contains some of the finest examples of 18th-century French furniture in the Royal Collection. The Green Drawing Room serves as a royal salon, while the Throne Room, with its iconic paired thrones, provides the backdrop for countless official photographs. Buckingham Palace\'s 39-acre garden, the largest private garden in London, hosts the Queen\'s annual garden parties, where approximately 30,000 guests are entertained each summer. The garden contains a helicopter landing pad, a lake with an island that provides a sanctuary for the palace\'s diverse wildlife, and the famous Waterloo Vase, a massive urn carved from a single piece of Carrara marble. The garden has played host to numerous events, from children\'s parties to the Diamond Jubilee concert in 2012. The palace is protected by the Queen\'s Guard, whose Changing of the Guard ceremony has become one of London\'s most popular tourist attractions. This colorful ceremony, accompanied by a Guards band, takes place in the palace forecourt and represents the formal handover of responsibility for protecting the palace from one guard to another. The ceremony attracts thousands of spectators daily during the summer months. Buckingham Palace has been the epicenter of British history and national life for nearly two centuries. It served as a hospital for wounded soldiers during World War I. During World War II, King George VI and Queen Elizabeth (later the Queen Mother) refused to leave London during the Blitz, staying at the palace despite it being bombed nine times. The King\'s famous words, "I\'m glad we\'ve been bombed. It makes me feel I can look the East End in the face," reflected the palace\'s role as a symbol of British resilience. The palace balcony has witnessed some of the most significant moments in British history. Winston Churchill appeared there with the Royal Family on VE Day in 1945. Prince William and Catherine Middleton shared their first kiss as a married couple there in 2011, watched by millions worldwide. The balcony appearance has become a tradition for royal weddings, jubilees, and national celebrations. The Royal Mews, located to the south of the palace, houses the royal collection of historic coaches and carriages, including the Gold State Coach used for coronations since 1762. The Diamond Jubilee State Coach, commissioned in 2012, incorporates wood from historic buildings including Westminster Abbey and the Tower of London. The Mews also houses the working horses and cars used for royal duties. The Queen\'s Gallery, opened in 1962, displays changing exhibitions from the Royal Collection, one of the world\'s great art collections. Originally built as a chapel destroyed during World War II, the gallery allows the public to view treasures that span 500 years, from Leonardo da Vinci drawings to Fabergé eggs. In recent years, Buckingham Palace has undergone a major ten-year renovation program, the largest since World War II, to upgrade its aging infrastructure while preserving its historic character. The work includes replacing aging electrical cables, plumbing, and heating systems, ensuring the palace can continue to function as a working royal residence and national monument for future generations. Buckingham Palace represents more than bricks and mortar - it embodies British monarchy, history, and national identity. It serves as both a family home and a working building, hosting over 50,000 guests annually at banquets, lunches, dinners, receptions, and garden parties. The palace is both a national treasure and a symbol of continuity, connecting Britain\'s past with its present and future. As the administrative headquarters of the monarchy, it remains at the heart of British public life, a place where history is made and where the traditions of centuries continue to evolve for modern times.',
    photos: [
      'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=800',
      'https://images.unsplash.com/photo-1587388423821-91ac0ae4977f?w=800',
      'https://images.unsplash.com/photo-1542641728-6ca359b085f4?w=800'
    ],
    historicalInfo: 'Buckingham Palace has served as the official London residence of the UK\'s sovereigns since 1837. It was originally a large townhouse built for the Duke of Buckingham in 1703.',
    yearBuilt: 'Original house: 1703, Palace expansion: 1826-1837',
    architect: 'William Winde (original), John Nash, Edward Blore, Aston Webb',
    translations: {
      en: {
        name: 'Buckingham Palace',
        narration: 'This is Buckingham Palace, the London residence of the British monarch. Watch the famous Changing of the Guard ceremony.',
        description: 'The official residence of the British monarch',
        detailedDescription: 'Buckingham Palace, the London residence and administrative headquarters of the British monarch, stands as one of the world\'s most recognizable symbols of royalty, state power, and British national identity. Located in the City of Westminster, this magnificent palace serves not only as the Queen\'s official London residence but also as the venue for numerous state occasions, royal ceremonies, and official entertaining. With 775 rooms, including 19 State Rooms, 52 Royal and guest bedrooms, 188 staff bedrooms, 92 offices, and 78 bathrooms, Buckingham Palace is one of the largest and most complex working palaces in the world. The site\'s history as a royal residence began in 1761 when King George III acquired Buckingham House, a large townhouse built for the Duke of Buckingham in 1703, as a private residence for Queen Charlotte. The original house, designed by William Winde, was a relatively modest brick building, far from the grand palace we see today. George III and Charlotte raised 14 of their 15 children there, preferring its comfortable domestic setting to the formality of St. James\'s Palace. George III called it the Queen\'s House, and it remained a private royal residence for nearly 60 years. The transformation from private house to grand palace began in 1826 when King George IV commissioned architect John Nash to expand and rebuild the structure as a suitable royal palace. Nash\'s ambitious Neoclassical design created a three-sided courtyard facing The Mall, featuring Bath stone façades and a magnificent central dome. However, George IV died before the work was completed, and his brother William IV, who succeeded him, showed little interest in the project. It was Queen Victoria who first made Buckingham Palace the principal royal residence in 1837, shortly after her accession to the throne. Finding the palace too small for court life and her growing family, Victoria commissioned Edward Blore to build a new wing closing the open side of Nash\'s courtyard. This wing, facing The Mall, was completed in 1847 and included the famous balcony where the Royal Family gathers for major celebrations. The original entrance, Nash\'s Marble Arch, was moved to its current position at the northeast corner of Hyde Park. The palace facade that visitors see today, the principal face of the palace, was refaced in 1913 with Portland stone by architect Aston Webb, creating the iconic image of Buckingham Palace known worldwide. Webb\'s design provided a more dignified and monumental backdrop for royal ceremonies and state occasions. The central balcony, part of Blore\'s wing, has become the iconic stage for royal appearances during moments of national celebration, from VE Day in 1945 to royal weddings and jubilees. The State Rooms, opened to the public each summer, showcase some of the greatest treasures of the Royal Collection. The Grand Staircase, with its elaborate gilded bronze balustrade, leads visitors to the State Rooms, which include the Throne Room, used for formal photographs at royal weddings and investiture ceremonies; the Picture Gallery, a 47-meter long room displaying masterpieces by Rembrandt, Rubens, Vermeer, and Canaletto; the White Drawing Room, where the Royal Family gathers before state occasions; and the magnificent Ballroom, the largest room in the palace, used for state banquets and investitures. The Music Room, with its beautiful domed ceiling, has witnessed numerous royal christenings, including those of Prince Charles, Prince William, Prince George, Princess Charlotte, and Prince Louis. The Blue Drawing Room, with its magnificent ceiling design by Nash, contains some of the finest examples of 18th-century French furniture in the Royal Collection. The Green Drawing Room serves as a royal salon, while the Throne Room, with its iconic paired thrones, provides the backdrop for countless official photographs. Buckingham Palace\'s 39-acre garden, the largest private garden in London, hosts the Queen\'s annual garden parties, where approximately 30,000 guests are entertained each summer. The garden contains a helicopter landing pad, a lake with an island that provides a sanctuary for the palace\'s diverse wildlife, and the famous Waterloo Vase, a massive urn carved from a single piece of Carrara marble. The garden has played host to numerous events, from children\'s parties to the Diamond Jubilee concert in 2012. The palace is protected by the Queen\'s Guard, whose Changing of the Guard ceremony has become one of London\'s most popular tourist attractions. This colorful ceremony, accompanied by a Guards band, takes place in the palace forecourt and represents the formal handover of responsibility for protecting the palace from one guard to another. The ceremony attracts thousands of spectators daily during the summer months. Buckingham Palace has been the epicenter of British history and national life for nearly two centuries. It served as a hospital for wounded soldiers during World War I. During World War II, King George VI and Queen Elizabeth (later the Queen Mother) refused to leave London during the Blitz, staying at the palace despite it being bombed nine times. The King\'s famous words, "I\'m glad we\'ve been bombed. It makes me feel I can look the East End in the face," reflected the palace\'s role as a symbol of British resilience. The palace balcony has witnessed some of the most significant moments in British history. Winston Churchill appeared there with the Royal Family on VE Day in 1945. Prince William and Catherine Middleton shared their first kiss as a married couple there in 2011, watched by millions worldwide. The balcony appearance has become a tradition for royal weddings, jubilees, and national celebrations. The Royal Mews, located to the south of the palace, houses the royal collection of historic coaches and carriages, including the Gold State Coach used for coronations since 1762. The Diamond Jubilee State Coach, commissioned in 2012, incorporates wood from historic buildings including Westminster Abbey and the Tower of London. The Mews also houses the working horses and cars used for royal duties. The Queen\'s Gallery, opened in 1962, displays changing exhibitions from the Royal Collection, one of the world\'s great art collections. Originally built as a chapel destroyed during World War II, the gallery allows the public to view treasures that span 500 years, from Leonardo da Vinci drawings to Fabergé eggs. In recent years, Buckingham Palace has undergone a major ten-year renovation program, the largest since World War II, to upgrade its aging infrastructure while preserving its historic character. The work includes replacing aging electrical cables, plumbing, and heating systems, ensuring the palace can continue to function as a working royal residence and national monument for future generations. Buckingham Palace represents more than bricks and mortar - it embodies British monarchy, history, and national identity. It serves as both a family home and a working building, hosting over 50,000 guests annually at banquets, lunches, dinners, receptions, and garden parties. The palace is both a national treasure and a symbol of continuity, connecting Britain\'s past with its present and future. As the administrative headquarters of the monarchy, it remains at the heart of British public life, a place where history is made and where the traditions of centuries continue to evolve for modern times.'
      },
      it: {
        name: 'Palazzo di Buckingham',
        narration: 'Questo è Buckingham Palace, la residenza londinese del monarca britannico. Osserva la famosa cerimonia del Cambio della Guardia.',
        description: 'La residenza ufficiale del monarca britannico',
        historicalInfo: 'Buckingham Palace è servito come residenza ufficiale londinese dei sovrani del Regno Unito dal 1837. Originariamente era una grande casa di città costruita per il Duca di Buckingham nel 1703.',
        yearBuilt: 'Casa originale: 1703, Espansione del palazzo: 1826-1837',
        architect: 'William Winde (originale), John Nash, Edward Blore, Aston Webb'
      },
      ko: {
        name: '버킹엄 궁전',
        narration: '영국 군주의 런던 거주지인 버킹엄 궁전입니다. 유명한 근위병 교대식을 관람하세요.',
        description: '영국 군주의 공식 거주지',
        detailedDescription: '버킹엄 궁전은 영국 군주의 런던 거주지이자 행정 본부로, 세계에서 가장 인식하기 쉬운 왕권, 국가 권력, 영국 국가 정체성의 상징 중 하나입니다. 웨스트민스터 시에 위치한 이 웅장한 궁전은 여왕의 공식 런던 거주지일 뿐만 아니라 수많은 국가 행사, 왕실 의식 및 공식 접대의 장소로도 사용됩니다. 19개의 국빈실, 52개의 왕실 및 게스트 침실, 188개의 직원 침실, 92개의 사무실, 78개의 욕실을 포함한 775개의 방을 갖춘 버킹엄 궁전은 세계에서 가장 크고 복잡한 현역 궁전 중 하나입니다. 왕실 거주지로서의 역사는 1761년 조지 3세가 샬롯 왕비를 위한 개인 거주지로 버킹엄 하우스(1703년 버킹엄 공작을 위해 건설된 대형 타운하우스)를 취득하면서 시작되었습니다. 1826년 조지 4세가 건축가 존 내시에게 이 구조물을 적절한 왕궁으로 확장하고 재건하도록 의뢰하면서 개인 주택에서 대궁전으로의 변화가 시작되었습니다. 빅토리아 여왕이 1837년 즉위 직후 버킹엄 궁전을 최초로 주요 왕실 거주지로 만들었습니다. 문화적으로 버킹엄 궁전은 영국 군주제를 세계에 제시하는 무대입니다. 방문 팁: 여름 개방 기간(7-9월) 동안 국빈실을 둘러보고, 4월부터 7월까지 거의 매일 열리는 근위병 교대식을 관람하며, 왕실 마구간에서 황금 마차를 구경하고, 궁전 정원을 산책하세요.',
        historicalInfo: '버킹엄 궁전은 1837년부터 영국 군주의 공식 런던 거주지로 사용되었습니다. 원래는 1703년에 버킹엄 공작을 위해 건설된 큰 저택이었습니다.',
        yearBuilt: '원래 저택: 1703년, 궁전 확장: 1826-1837년',
        architect: '윌리엄 윈드 (원래), 존 내시, 에드워드 블로어, 애스턴 웹'
      },
      es: {
        name: 'Palacio de Buckingham',
        narration: 'Este es el Palacio de Buckingham, la residencia londinense del monarca británico. Observe la famosa ceremonia del Cambio de Guardia.',
        description: 'La residencia oficial del monarca británico',
        historicalInfo: 'El Palacio de Buckingham ha servido como residencia oficial londinense de los soberanos del Reino Unido desde 1837. Originalmente era una gran casa señorial construida para el Duque de Buckingham en 1703.',
        yearBuilt: 'Casa original: 1703, Expansión del palacio: 1826-1837',
        architect: 'William Winde (original), John Nash, Edward Blore, Aston Webb'
      },
      fr: {
        name: 'Palais de Buckingham',
        narration: 'Voici le Palais de Buckingham, la résidence londonienne du monarque britannique. Assistez à la célèbre cérémonie de la relève de la garde.',
        description: 'La résidence officielle du monarque britannique',
        historicalInfo: 'Le Palais de Buckingham sert de résidence officielle londonienne des souverains du Royaume-Uni depuis 1837. À l\'origine, c\'était une grande maison de ville construite pour le duc de Buckingham en 1703.',
        yearBuilt: 'Maison originale: 1703, Expansion du palais: 1826-1837',
        architect: 'William Winde (original), John Nash, Edward Blore, Aston Webb'
      },
      de: {
        name: 'Buckingham Palace',
        narration: 'Dies ist der Buckingham Palace, die Londoner Residenz des britischen Monarchen. Beobachten Sie die berühmte Wachablösung.',
        description: 'Die offizielle Residenz des britischen Monarchen',
        historicalInfo: 'Der Buckingham Palace dient seit 1837 als offizielle Londoner Residenz der britischen Monarchen. Ursprünglich war es ein großes Stadthaus, das 1703 für den Herzog von Buckingham gebaut wurde.',
        yearBuilt: 'Ursprüngliches Haus: 1703, Palasterweiterung: 1826-1837',
        architect: 'William Winde (ursprünglich), John Nash, Edward Blore, Aston Webb'
      },
      zh: {
        name: '白金汉宫',
        narration: '这是白金汉宫，英国君主的伦敦住所。观看著名的卫兵换岗仪式。',
        description: '英国君主的官方住所',
        detailedDescription: '白金汉宫是英国君主的伦敦住所和行政总部，是世界上最知名的皇室、国家权力和英国国家认同象征之一。这座位于威斯敏斯特市的宏伟宫殿不仅是女王的官方伦敦住所，也是众多国家活动、皇家仪式和官方招待的场所。白金汉宫拥有775个房间，包括19间国事厅、52间皇室和客房、188间员工卧室、92间办公室和78间浴室，是世界上最大、最复杂的在用宫殿之一。该地作为皇家住所的历史始于1761年，当时乔治三世购买了白金汉宫（1703年为白金汉公爵建造的大型城镇住宅），作为夏洛特王后的私人住所。从私人住宅到宏伟宫殿的转变始于1826年，当时乔治四世委托建筑师约翰·纳什将该建筑扩建并重建为合适的皇宫。纳什雄心勃勃的新古典主义设计创造了一个面向林荫大道的三面庭院，采用巴斯石外墙和宏伟的中央圆顶。维多利亚女王在1837年登基后不久首次将白金汉宫作为主要皇家住所。文化上，白金汉宫是向世界展示英国君主制的舞台。参观提示：在夏季开放期间（7-9月）参观国事厅，观看4月至7月几乎每天举行的卫兵换岗仪式，在皇家马厩欣赏金马车，漫步宫殿花园。',
        historicalInfo: '白金汉宫自1837年以来一直担任英国君主的官方伦敦住所。它最初是1703年为白金汉公爵建造的一座大型城镇住宅。',
        yearBuilt: '原建筑：1703年，宫殿扩建：1826-1837年',
        architect: '威廉·温德（原建筑），约翰·纳什，爱德华·布洛尔，阿斯顿·韦伯'
      },
      ja: {
        name: 'バッキンガム宮殿',
        narration: 'これは英国君主のロンドン邸宅、バッキンガム宮殿です。有名な衛兵交代式をご覧ください。',
        description: '英国君主の公式邸宅',
        detailedDescription: 'バッキンガム宮殿は英国君主のロンドン邸宅および行政本部であり、世界で最も認知度の高い王権、国家権力、イギリス国家アイデンティティの象徴の一つです。ウェストミンスター市に位置するこの壮大な宮殿は、女王の公式ロンドン邸宅としてだけでなく、数多くの国家行事、王室儀式、公式接待の会場としても機能しています。19の国事室、52の王室および客室寝室、188の職員寝室、92のオフィス、78の浴室を含む775の部屋を備えたバッキンガム宮殿は、世界最大かつ最も複雑な現役宮殿の一つです。王室邸宅としての歴史は1761年に始まり、ジョージ3世がシャーロット王妃のための私邸として、1703年にバッキンガム公爵のために建てられた大きなタウンハウス、バッキンガムハウスを取得しました。私邸から壮大な宮殿への変容は1826年に始まり、ジョージ4世が建築家ジョン・ナッシュに、この建造物を適切な王宮として拡張し再建するよう依頼しました。ナッシュの野心的な新古典主義デザインは、バース石のファサードと壮大な中央ドームを特徴とする、ザ・マルに面した三方を囲む中庭を創造しました。ヴィクトリア女王は1837年の即位直後に、初めてバッキンガム宮殿を主要な王室邸宅としました。文化的に、バッキンガム宮殿は世界にイギリス君主制を提示する舞台です。訪問のヒント：夏季開放期間（7-9月）に国事室を見学し、4月から7月までほぼ毎日開催される衛兵交代式を観覧し、王室厩舎で金の馬車を鑑賞し、宮殿庭園を散策してください。',
        historicalInfo: 'バッキンガム宮殿は1837年以来、英国君主の公式ロンドン邸宅として使用されています。元々は1703年にバッキンガム公爵のために建てられた大きなタウンハウスでした。',
        yearBuilt: '元の建物：1703年、宮殿拡張：1826-1837年',
        architect: 'ウィリアム・ウィンド（元の建物）、ジョン・ナッシュ、エドワード・ブロア、アストン・ウェブ'
      },
      pt: {
        name: 'Palácio de Buckingham',
        narration: 'Este é o Palácio de Buckingham, a residência londrina do monarca britânico. Assista à famosa cerimônia da Troca da Guarda.',
        description: 'A residência oficial do monarca britânico',
        historicalInfo: 'O Palácio de Buckingham tem servido como residência oficial londrina dos soberanos do Reino Unido desde 1837. Originalmente era uma grande casa de cidade construída para o Duque de Buckingham em 1703.',
        yearBuilt: 'Casa original: 1703, Expansão do palácio: 1826-1837',
        architect: 'William Winde (original), John Nash, Edward Blore, Aston Webb'
      },
      ru: {
        name: 'Букингемский дворец',
        narration: 'Это Букингемский дворец, лондонская резиденция британского монарха. Посмотрите знаменитую церемонию смены караула.',
        description: 'Официальная резиденция британского монарха',
        historicalInfo: 'Букингемский дворец служит официальной лондонской резиденцией британских монархов с 1837 года. Первоначально это был большой особняк, построенный для герцога Бэкингема в 1703 году.',
        yearBuilt: 'Оригинальный дом: 1703, Расширение дворца: 1826-1837',
        architect: 'Уильям Уинд (оригинал), Джон Нэш, Эдвард Блор, Астон Уэбб'
      }
    }
  },
  {
    id: 'london_eye',
    cityId: 'london',
    name: 'London Eye',
    lat: 51.503399,
    lng: -0.119519,
    radius: 50,
    narration: 'The London Eye is a giant observation wheel offering spectacular views over the city.',
    description: 'Europe\'s tallest cantilevered observation wheel',
    category: 'Attraction',
    detailedDescription: 'The London Eye, also known as the Millennium Wheel, stands as one of the world\'s most iconic observation wheels and London\'s most popular paid tourist attraction, welcoming over 3.5 million visitors annually to experience breathtaking 360-degree views of the British capital. Rising 135 meters (443 feet) above the South Bank of the River Thames, this engineering marvel has transformed London\'s skyline since its opening in 2000, becoming as synonymous with the city as Big Ben, Tower Bridge, and Buckingham Palace. The London Eye was conceived as part of the millennium celebrations, designed to be a temporary structure that would stand for just five years. However, its immediate popularity and iconic status led to it becoming a permanent fixture of London\'s landscape. The wheel was designed by architects David Marks and Julia Barfield, who won a competition organized by The Sunday Times and the Architecture Foundation to design a landmark to celebrate the new millennium. Their innovative design drew inspiration from the engineering principles of bicycle wheels, creating a cantilevered structure that appears to float effortlessly above the Thames. Construction of the London Eye was an engineering feat of remarkable complexity and ambition. The wheel was constructed in sections, with components manufactured across Europe and transported to London for assembly. The A-frame legs, which support the wheel\'s massive weight, were transported up the Thames on barges and lifted into position by some of Europe\'s largest floating cranes. The wheel itself was assembled horizontally on temporary platforms in the river, then slowly raised to its vertical position over the course of a week in October 1999 using a sophisticated jacking system. The process was so delicate and unprecedented that it captured worldwide attention, with thousands gathering to watch the dramatic tilting of the massive structure. The London Eye consists of 32 sealed and air-conditioned passenger capsules, representing the 32 London boroughs. Interestingly, the capsules are numbered 1 to 33, skipping number 13 for superstitious reasons. Each capsule weighs 10 tons, is built to carry 25 people, and provides unobstructed 360-degree views through its glass construction. The capsules are attached to the external circumference of the wheel and rotate in motorized fashion, maintaining a horizontal position as the wheel turns, ensuring passengers always have an upright viewing platform. A complete rotation takes approximately 30 minutes, moving at a stately pace of 0.9 kilometers per hour (0.6 mph), allowing the wheel to continue moving while passengers board and alight - though it can be stopped for disabled or elderly passengers who need more time. The wheel weighs approximately 2,100 tons, with the rim alone weighing 1,700 tons. It is supported by an A-frame on one side only, making it the world\'s tallest cantilevered observation wheel. This cantilever design, with the wheel supported from one side rather than both, creates the distinctive silhouette that has become so recognizable. The structure requires 1,700 tons of steel and took seven years from conception to completion, at a cost of £75 million. From the top of the London Eye, on a clear day, visitors can see up to 40 kilometers (25 miles) in all directions, encompassing Windsor Castle to the west and the hills of Kent to the south. The views include all of London\'s major landmarks: the Houses of Parliament and Big Ben directly across the river, St. Paul\'s Cathedral\'s distinctive dome, the Tower of London, Tower Bridge, the Shard piercing the sky, and countless other historic and modern buildings that tell the story of London\'s evolution from Roman settlement to global metropolis. The London Eye has become much more than an observation wheel - it serves as a cultural landmark and event venue. The capsules have hosted everything from weddings to business meetings, from yoga sessions to wine tastings. In 2005, one capsule was temporarily converted into a luxury apartment where two competition winners spent the night suspended 135 meters above London. The wheel has been illuminated in various colors to mark significant events: red for Chinese New Year, pink for breast cancer awareness, rainbow colors for Pride, and even the colors of national flags to welcome visiting dignitaries. The London Eye played a central role in London\'s millennium celebrations, with a spectacular fireworks display launched from the wheel itself at midnight on January 1, 2000 - though technical problems meant the wheel wasn\'t actually rotating for passengers until March 2000. Since then, it has become the focal point for London\'s New Year\'s Eve celebrations, with elaborate firework displays launched from the wheel and surrounding area, broadcast to millions worldwide. The wheel has also been featured in numerous films, television shows, and music videos, from the James Bond thriller "Spectre" to the romantic comedy "Bridget Jones\'s Diary," cementing its place in popular culture. Its distinctive circular form has become an instantly recognizable symbol of London, appearing in countless photographs, paintings, and promotional materials for the city. In 2015, the London Eye underwent a major refurbishment, with Coca-Cola becoming the title sponsor, leading to it being officially branded as the "Coca-Cola London Eye" - though most Londoners and visitors continue to call it simply "The London Eye." The refurbishment included new lighting systems using LED technology, creating more dynamic and energy-efficient illumination displays that can change color and pattern for special events. The London Eye pioneered the concept of large-scale observation wheels in major cities, inspiring similar structures worldwide, including the Singapore Flyer, the High Roller in Las Vegas, and the Dubai Eye. However, the London Eye remains unique in its cantilever design and its integration into the urban landscape, positioned to provide optimal views of one of the world\'s most historic cityscapes. The observation wheel has also contributed significantly to the regeneration of London\'s South Bank, which has transformed from an underutilized industrial area into one of London\'s most vibrant cultural quarters. The area now features theaters, galleries, restaurants, and public spaces, with the London Eye serving as the anchor attraction that draws millions of visitors who then explore the surrounding cultural offerings. During the COVID-19 pandemic, the London Eye stood silent for months, its empty capsules a poignant symbol of the tourism industry\'s challenges. However, upon reopening, it implemented new safety measures and private capsule bookings, demonstrating its adaptability and resilience. The pandemic period also saw the wheel illuminated in rainbow colors to honor NHS workers and in other meaningful displays of solidarity and hope. Today, the London Eye stands as a symbol of the turn of the millennium, a monument to engineering ingenuity, and a beloved London landmark that offers both residents and visitors a unique perspective on one of the world\'s great cities. It represents London\'s ability to embrace the new while honoring the old, to innovate while respecting tradition. From its capsules, suspended above the Thames, passengers gain not just a view of London but a new understanding of the city\'s layout, history, and evolution - a 30-minute journey that connects past, present, and future in the most literal and spectacular way possible. The London Eye reminds us that sometimes the best way to appreciate where we are is to step back, rise above, and see the bigger picture.',
    photos: [
      'https://images.unsplash.com/photo-1543716021-36e0f757e6c9?w=800',
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
      'https://images.unsplash.com/photo-1520116468816-95b69f847357?w=800'
    ],
    historicalInfo: 'The London Eye was built to celebrate the millennium and opened to the public in March 2000. It was designed by architects David Marks and Julia Barfield and has become one of London\'s most iconic landmarks.',
    yearBuilt: '1999-2000',
    architect: 'David Marks and Julia Barfield',
    translations: {
      en: {
        name: 'London Eye',
        narration: 'The London Eye is a giant observation wheel offering spectacular views over the city.',
        description: 'Europe\'s tallest cantilevered observation wheel',
        detailedDescription: 'The London Eye, also known as the Millennium Wheel, stands as one of the world\'s most iconic observation wheels and London\'s most popular paid tourist attraction, welcoming over 3.5 million visitors annually to experience breathtaking 360-degree views of the British capital. Rising 135 meters (443 feet) above the South Bank of the River Thames, this engineering marvel has transformed London\'s skyline since its opening in 2000, becoming as synonymous with the city as Big Ben, Tower Bridge, and Buckingham Palace. The London Eye was conceived as part of the millennium celebrations, designed to be a temporary structure that would stand for just five years. However, its immediate popularity and iconic status led to it becoming a permanent fixture of London\'s landscape. The wheel was designed by architects David Marks and Julia Barfield, who won a competition organized by The Sunday Times and the Architecture Foundation to design a landmark to celebrate the new millennium. Their innovative design drew inspiration from the engineering principles of bicycle wheels, creating a cantilevered structure that appears to float effortlessly above the Thames. Construction of the London Eye was an engineering feat of remarkable complexity and ambition. The wheel was constructed in sections, with components manufactured across Europe and transported to London for assembly. The A-frame legs, which support the wheel\'s massive weight, were transported up the Thames on barges and lifted into position by some of Europe\'s largest floating cranes. The wheel itself was assembled horizontally on temporary platforms in the river, then slowly raised to its vertical position over the course of a week in October 1999 using a sophisticated jacking system. The process was so delicate and unprecedented that it captured worldwide attention, with thousands gathering to watch the dramatic tilting of the massive structure. The London Eye consists of 32 sealed and air-conditioned passenger capsules, representing the 32 London boroughs. Interestingly, the capsules are numbered 1 to 33, skipping number 13 for superstitious reasons. Each capsule weighs 10 tons, is built to carry 25 people, and provides unobstructed 360-degree views through its glass construction. The capsules are attached to the external circumference of the wheel and rotate in motorized fashion, maintaining a horizontal position as the wheel turns, ensuring passengers always have an upright viewing platform. A complete rotation takes approximately 30 minutes, moving at a stately pace of 0.9 kilometers per hour (0.6 mph), allowing the wheel to continue moving while passengers board and alight - though it can be stopped for disabled or elderly passengers who need more time. The wheel weighs approximately 2,100 tons, with the rim alone weighing 1,700 tons. It is supported by an A-frame on one side only, making it the world\'s tallest cantilevered observation wheel. This cantilever design, with the wheel supported from one side rather than both, creates the distinctive silhouette that has become so recognizable. The structure requires 1,700 tons of steel and took seven years from conception to completion, at a cost of £75 million. From the top of the London Eye, on a clear day, visitors can see up to 40 kilometers (25 miles) in all directions, encompassing Windsor Castle to the west and the hills of Kent to the south. The views include all of London\'s major landmarks: the Houses of Parliament and Big Ben directly across the river, St. Paul\'s Cathedral\'s distinctive dome, the Tower of London, Tower Bridge, the Shard piercing the sky, and countless other historic and modern buildings that tell the story of London\'s evolution from Roman settlement to global metropolis. The London Eye has become much more than an observation wheel - it serves as a cultural landmark and event venue. The capsules have hosted everything from weddings to business meetings, from yoga sessions to wine tastings. In 2005, one capsule was temporarily converted into a luxury apartment where two competition winners spent the night suspended 135 meters above London. The wheel has been illuminated in various colors to mark significant events: red for Chinese New Year, pink for breast cancer awareness, rainbow colors for Pride, and even the colors of national flags to welcome visiting dignitaries. The London Eye played a central role in London\'s millennium celebrations, with a spectacular fireworks display launched from the wheel itself at midnight on January 1, 2000 - though technical problems meant the wheel wasn\'t actually rotating for passengers until March 2000. Since then, it has become the focal point for London\'s New Year\'s Eve celebrations, with elaborate firework displays launched from the wheel and surrounding area, broadcast to millions worldwide. The wheel has also been featured in numerous films, television shows, and music videos, from the James Bond thriller "Spectre" to the romantic comedy "Bridget Jones\'s Diary," cementing its place in popular culture. Its distinctive circular form has become an instantly recognizable symbol of London, appearing in countless photographs, paintings, and promotional materials for the city. In 2015, the London Eye underwent a major refurbishment, with Coca-Cola becoming the title sponsor, leading to it being officially branded as the "Coca-Cola London Eye" - though most Londoners and visitors continue to call it simply "The London Eye." The refurbishment included new lighting systems using LED technology, creating more dynamic and energy-efficient illumination displays that can change color and pattern for special events. The London Eye pioneered the concept of large-scale observation wheels in major cities, inspiring similar structures worldwide, including the Singapore Flyer, the High Roller in Las Vegas, and the Dubai Eye. However, the London Eye remains unique in its cantilever design and its integration into the urban landscape, positioned to provide optimal views of one of the world\'s most historic cityscapes. The observation wheel has also contributed significantly to the regeneration of London\'s South Bank, which has transformed from an underutilized industrial area into one of London\'s most vibrant cultural quarters. The area now features theaters, galleries, restaurants, and public spaces, with the London Eye serving as the anchor attraction that draws millions of visitors who then explore the surrounding cultural offerings. During the COVID-19 pandemic, the London Eye stood silent for months, its empty capsules a poignant symbol of the tourism industry\'s challenges. However, upon reopening, it implemented new safety measures and private capsule bookings, demonstrating its adaptability and resilience. The pandemic period also saw the wheel illuminated in rainbow colors to honor NHS workers and in other meaningful displays of solidarity and hope. Today, the London Eye stands as a symbol of the turn of the millennium, a monument to engineering ingenuity, and a beloved London landmark that offers both residents and visitors a unique perspective on one of the world\'s great cities. It represents London\'s ability to embrace the new while honoring the old, to innovate while respecting tradition. From its capsules, suspended above the Thames, passengers gain not just a view of London but a new understanding of the city\'s layout, history, and evolution - a 30-minute journey that connects past, present, and future in the most literal and spectacular way possible. The London Eye reminds us that sometimes the best way to appreciate where we are is to step back, rise above, and see the bigger picture.',
        historicalInfo: 'The London Eye was built to celebrate the millennium and opened to the public in March 2000. It was designed by architects David Marks and Julia Barfield and has become one of London\'s most iconic landmarks.',
        yearBuilt: '1999-2000',
        architect: 'David Marks and Julia Barfield'
      },
      it: {
        name: 'London Eye',
        narration: 'Il London Eye è una gigantesca ruota panoramica che offre viste spettacolari sulla città.',
        description: 'La ruota panoramica a sbalzo più alta d\'Europa',
        historicalInfo: 'Il London Eye è stato costruito per celebrare il millennio e aperto al pubblico nel marzo 2000. È stato progettato dagli architetti David Marks e Julia Barfield ed è diventato uno dei monumenti più iconici di Londra.',
        yearBuilt: '1999-2000',
        architect: 'David Marks e Julia Barfield'
      },
      ko: {
        name: '런던 아이',
        narration: '런던 아이는 도시의 멋진 전망을 제공하는 거대한 관람차입니다.',
        description: '유럽에서 가장 높은 캔틸레버 관람차',
        detailedDescription: '밀레니엄 휠로도 알려진 런던 아이는 세계에서 가장 상징적인 관람차 중 하나이자 런던에서 가장 인기 있는 유료 관광 명소로, 매년 350만 명 이상의 방문객이 영국 수도의 숨막히는 360도 전망을 경험하러 옵니다. 템스강 남안 위로 135미터(443피트) 높이로 솟아 있는 이 공학적 경이로움은 2000년 개장 이래 런던의 스카이라인을 변화시켰으며, 빅벤, 타워 브리지, 버킹엄 궁전만큼이나 런던의 상징이 되었습니다. 런던 아이는 밀레니엄 축하의 일환으로 구상되었으며, 단 5년만 서 있을 임시 구조물로 설계되었습니다. 그러나 즉각적인 인기와 상징적 지위로 인해 런던 풍경의 영구적인 고정물이 되었습니다. 이 바퀴는 건축가 데이비드 마크스와 줄리아 바필드가 설계했으며, 그들은 새로운 밀레니엄을 기념할 랜드마크를 설계하기 위해 선데이 타임즈와 건축 재단이 조직한 경쟁에서 우승했습니다. 그들의 혁신적인 디자인은 자전거 바퀴의 공학 원리에서 영감을 받아, 템스강 위에 손쉽게 떠 있는 것처럼 보이는 캔틸레버 구조를 만들었습니다. 방문 팁: 맑은 날 30분 회전 중 최대 40킬로미터까지 볼 수 있으며, 일몰 무렵 방문하여 황금빛 시간대 전망을 즐기고, 특별한 경험을 위해 프라이빗 캡슐을 예약하며, 4D 시네마 경험을 체험하세요.',
        historicalInfo: '런던 아이는 밀레니엄을 기념하기 위해 건설되었으며 2000년 3월에 대중에게 개방되었습니다. 건축가 데이비드 마크스와 줄리아 바필드가 설계했으며 런던의 가장 상징적인 랜드마크 중 하나가 되었습니다.',
        yearBuilt: '1999-2000',
        architect: '데이비드 마크스와 줄리아 바필드'
      },
      es: {
        name: 'London Eye',
        narration: 'El London Eye es una noria gigante que ofrece vistas espectaculares de la ciudad.',
        description: 'La noria en voladizo más alta de Europa',
        historicalInfo: 'El London Eye fue construido para celebrar el milenio y abierto al público en marzo de 2000. Fue diseñado por los arquitectos David Marks y Julia Barfield y se ha convertido en uno de los monumentos más icónicos de Londres.',
        yearBuilt: '1999-2000',
        architect: 'David Marks y Julia Barfield'
      },
      fr: {
        name: 'London Eye',
        narration: 'Le London Eye est une grande roue offrant des vues spectaculaires sur la ville.',
        description: 'La plus haute grande roue en porte-à-faux d\'Europe',
        historicalInfo: 'Le London Eye a été construit pour célébrer le millénaire et ouvert au public en mars 2000. Il a été conçu par les architectes David Marks et Julia Barfield et est devenu l\'un des monuments les plus emblématiques de Londres.',
        yearBuilt: '1999-2000',
        architect: 'David Marks et Julia Barfield'
      },
      de: {
        name: 'London Eye',
        narration: 'Das London Eye ist ein riesiges Riesenrad, das spektakuläre Ausblicke über die Stadt bietet.',
        description: 'Das höchste freitragende Riesenrad Europas',
        historicalInfo: 'Das London Eye wurde zur Feier des Jahrtausendwechsels gebaut und im März 2000 für die Öffentlichkeit eröffnet. Es wurde von den Architekten David Marks und Julia Barfield entworfen und ist zu einem der ikonischsten Wahrzeichen Londons geworden.',
        yearBuilt: '1999-2000',
        architect: 'David Marks und Julia Barfield'
      },
      zh: {
        name: '伦敦眼',
        narration: '伦敦眼是一座巨型摩天轮，可欣赏城市壮观景色。',
        description: '欧洲最高的悬臂式摩天轮',
        detailedDescription: '伦敦眼，也称为千禧轮，是世界上最具标志性的观景轮之一，也是伦敦最受欢迎的付费旅游景点，每年欢迎超过350万游客体验英国首都令人叹为观止的360度全景。这座工程奇迹高耸于泰晤士河南岸上方135米（443英尺），自2000年开放以来改变了伦敦的天际线，与大本钟、塔桥和白金汉宫一样成为伦敦的代名词。伦敦眼作为千禧年庆祝活动的一部分而构思，设计为只矗立五年的临时结构。然而，其即时的受欢迎程度和标志性地位使其成为伦敦景观的永久性固定装置。摩天轮由建筑师大卫·马克斯和朱莉娅·巴菲尔德设计，他们赢得了由《星期日泰晤士报》和建筑基金会组织的竞赛，旨在设计一个庆祝新千年的地标。他们的创新设计从自行车轮的工程原理中汲取灵感，创造了一个看似毫不费力地漂浮在泰晤士河上的悬臂结构。伦敦眼的建设是一项复杂而雄心勃勃的工程壮举。摩天轮分段建造，组件在整个欧洲制造并运往伦敦组装。参观提示：在晴朗的日子里，30分钟的旋转可以看到最远40公里的景色，在日落时分访问以获得黄金时段的景色，为特殊体验预订私人舱，体验4D电影体验。',
        historicalInfo: '伦敦眼是为庆祝千禧年而建，于2000年3月向公众开放。它由建筑师大卫·马克斯和朱莉娅·巴菲尔德设计，已成为伦敦最具标志性的地标之一。',
        yearBuilt: '1999-2000',
        architect: '大卫·马克斯和朱莉娅·巴菲尔德'
      },
      ja: {
        name: 'ロンドン・アイ',
        narration: 'ロンドン・アイは、街の素晴らしい景色を提供する巨大な観覧車です。',
        description: 'ヨーロッパで最も高い片持ち式観覧車',
        detailedDescription: 'ミレニアム・ホイールとしても知られるロンドン・アイは、世界で最も象徴的な観覧車の一つであり、ロンドンで最も人気のある有料観光名所で、毎年350万人以上の訪問者が英国首都の息をのむような360度の景色を体験するために訪れます。テムズ川のサウスバンクの上135メートル（443フィート）にそびえ立つこの工学の驚異は、2000年の開業以来ロンドンのスカイラインを変え、ビッグ・ベン、タワーブリッジ、バッキンガム宮殿と同様にこの都市の代名詞となっています。ロンドン・アイはミレニアム祝賀の一環として構想され、わずか5年間立つ一時的な構造物として設計されました。しかし、その即座の人気と象徴的な地位により、ロンドンの景観の恒久的な固定物となりました。この観覧車は建築家デイビッド・マークスとジュリア・バーフィールドによって設計され、彼らは新しいミレニアムを祝うランドマークを設計するためにサンデー・タイムズと建築財団が主催したコンペティションで優勝しました。彼らの革新的なデザインは自転車の車輪の工学原理からインスピレーションを得て、テムズ川の上に楽々と浮かんでいるように見える片持ち式構造を創り出しました。ロンドン・アイの建設は、驚くべき複雑さと野心の工学的偉業でした。訪問のヒント：晴れた日には30分の回転中に最大40キロメートルまで見渡せます、夕暮れ時に訪れてゴールデンアワーの景色を楽しみ、特別な体験のためにプライベートカプセルを予約し、4Dシネマ体験を体験してください。',
        historicalInfo: 'ロンドン・アイはミレニアムを祝うために建設され、2000年3月に一般公開されました。建築家デイビッド・マークスとジュリア・バーフィールドによって設計され、ロンドンで最も象徴的なランドマークの1つとなりました。',
        yearBuilt: '1999-2000',
        architect: 'デイビッド・マークスとジュリア・バーフィールド'
      },
      pt: {
        name: 'London Eye',
        narration: 'O London Eye é uma roda-gigante que oferece vistas espetaculares sobre a cidade.',
        description: 'A roda-gigante em balanço mais alta da Europa',
        historicalInfo: 'O London Eye foi construído para celebrar o milênio e aberto ao público em março de 2000. Foi projetado pelos arquitetos David Marks e Julia Barfield e se tornou um dos marcos mais icônicos de Londres.',
        yearBuilt: '1999-2000',
        architect: 'David Marks e Julia Barfield'
      },
      ru: {
        name: 'Лондонский глаз',
        narration: 'Лондонский глаз - это гигантское колесо обозрения, откуда открываются захватывающие виды на город.',
        description: 'Самое высокое консольное колесо обозрения в Европе',
        historicalInfo: 'Лондонский глаз был построен в честь празднования миллениума и открыт для публики в марте 2000 года. Он был спроектирован архитекторами Дэвидом Марксом и Джулией Барфилд и стал одной из самых знаковых достопримечательностей Лондона.',
        yearBuilt: '1999-2000',
        architect: 'Дэвид Маркс и Джулия Барфилд'
      }
    }
  },
  {
    id: 'westminster_abbey',
    cityId: 'london',
    name: 'Westminster Abbey',
    lat: 51.499361,
    lng: -0.127305,
    radius: 60,
    narration: 'Welcome to Westminster Abbey, the coronation church since 1066. This Gothic masterpiece has witnessed the crowning of 40 monarchs.',
    description: 'Historic coronation church and burial place of British monarchs',
    category: 'Religious Site',
    detailedDescription: 'Westminster Abbey stands as one of the most important religious buildings in the United Kingdom and a UNESCO World Heritage Site. For over a thousand years, this magnificent Gothic church has been the coronation venue for British monarchs, and it continues to serve as the site for royal weddings and state funerals. The Abbey contains the tombs of 17 monarchs and numerous famous Britons, including Charles Darwin, Isaac Newton, and Charles Dickens in Poets\' Corner.',
    photos: [
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800',
      'https://images.unsplash.com/photo-1543716021-36e0f757e6c9?w=800'
    ],
    historicalInfo: 'Westminster Abbey was founded in 960 AD and has been the coronation church since 1066. It is the final resting place of 17 monarchs and numerous famous Britons.',
    yearBuilt: '960 AD (rebuilt 1245-1517)',
    architect: 'Various architects, notably Henry Yevele',
    translations: {
      en: {
        name: 'Westminster Abbey',
        narration: 'Welcome to Westminster Abbey, the coronation church since 1066. This Gothic masterpiece has witnessed the crowning of 40 monarchs.',
        description: 'Historic coronation church and burial place of British monarchs',
        historicalInfo: 'Westminster Abbey was founded in 960 AD and has been the coronation church since 1066.',
        yearBuilt: '960 AD (rebuilt 1245-1517)',
        architect: 'Various architects, notably Henry Yevele'
      },
      it: {
        name: 'Abbazia di Westminster',
        narration: 'Benvenuti all\'Abbazia di Westminster, la chiesa dell\'incoronazione dal 1066. Questo capolavoro gotico ha assistito all\'incoronazione di 40 monarchi.',
        description: 'Storica chiesa dell\'incoronazione e luogo di sepoltura dei monarchi britannici',
        historicalInfo: 'L\'Abbazia di Westminster fu fondata nel 960 d.C. ed è stata la chiesa dell\'incoronazione dal 1066.',
        yearBuilt: '960 d.C. (ricostruita 1245-1517)',
        architect: 'Vari architetti, in particolare Henry Yevele'
      },
      ko: {
        name: '웨스트민스터 사원',
        narration: '1066년부터 대관식 교회로 사용된 웨스트민스터 사원에 오신 것을 환영합니다. 이 고딕 양식의 걸작은 40명의 군주의 대관식을 목격했습니다.',
        description: '영국 군주들의 역사적인 대관식 교회이자 안식처',
        historicalInfo: '웨스트민스터 사원은 서기 960년에 설립되었으며 1066년부터 대관식 교회로 사용되었습니다.',
        yearBuilt: '960년 (1245-1517년 재건축)',
        architect: '여러 건축가들, 특히 헨리 예벨'
      }
    }
  },
  {
    id: 'british_museum',
    cityId: 'london',
    name: 'British Museum',
    lat: 51.519413,
    lng: -0.126957,
    radius: 70,
    narration: 'Welcome to the British Museum, one of the world\'s greatest museums of human history and culture. It houses over 8 million works spanning two million years.',
    description: 'World-renowned museum of human history and culture',
    category: 'Museum',
    detailedDescription: 'The British Museum, founded in 1753, is the world\'s first national public museum and remains one of the most comprehensive museums dedicated to human history, art, and culture. Its permanent collection of approximately eight million works is among the largest and most comprehensive in existence, documenting the story of human culture from its beginnings to the present. The museum is famous for treasures such as the Rosetta Stone, Egyptian mummies, the Elgin Marbles, and the Lewis Chessmen.',
    photos: [
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800',
      'https://images.unsplash.com/photo-1575223970966-76ae61ee7838?w=800',
      'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=800'
    ],
    historicalInfo: 'The British Museum was founded in 1753 and was the world\'s first national public museum. It opened to visitors in 1759 and has since become one of the most visited museums globally.',
    yearBuilt: '1753 (current building: 1823-1852)',
    architect: 'Sir Robert Smirke (main building), Norman Foster (Great Court roof)',
    translations: {
      en: {
        name: 'British Museum',
        narration: 'Welcome to the British Museum, one of the world\'s greatest museums of human history and culture. It houses over 8 million works spanning two million years.',
        description: 'World-renowned museum of human history and culture',
        historicalInfo: 'The British Museum was founded in 1753 and was the world\'s first national public museum.',
        yearBuilt: '1753 (current building: 1823-1852)',
        architect: 'Sir Robert Smirke (main building), Norman Foster (Great Court roof)'
      },
      it: {
        name: 'British Museum',
        narration: 'Benvenuti al British Museum, uno dei più grandi musei di storia e cultura dell\'umanità al mondo. Ospita oltre 8 milioni di opere che coprono due milioni di anni.',
        description: 'Museo di fama mondiale di storia e cultura umana',
        historicalInfo: 'Il British Museum fu fondato nel 1753 e fu il primo museo pubblico nazionale al mondo.',
        yearBuilt: '1753 (edificio attuale: 1823-1852)',
        architect: 'Sir Robert Smirke (edificio principale), Norman Foster (tetto Great Court)'
      },
      ko: {
        name: '대영박물관',
        narration: '인류 역사와 문화의 세계 최고의 박물관 중 하나인 대영박물관에 오신 것을 환영합니다. 200만 년에 걸친 800만 점 이상의 작품을 소장하고 있습니다.',
        description: '세계적으로 유명한 인류 역사 및 문화 박물관',
        historicalInfo: '대영박물관은 1753년에 설립되었으며 세계 최초의 국립 공공 박물관입니다.',
        yearBuilt: '1753년 (현재 건물: 1823-1852년)',
        architect: '로버트 스머크 경 (본관), 노먼 포스터 (그레이트 코트 지붕)'
      }
    }
  },
  {
    id: 'st_pauls_cathedral',
    cityId: 'london',
    name: 'St. Paul\'s Cathedral',
    lat: 51.513845,
    lng: -0.098351,
    radius: 60,
    narration: 'Welcome to St. Paul\'s Cathedral, Sir Christopher Wren\'s Baroque masterpiece. Its iconic dome has dominated London\'s skyline for over 300 years.',
    description: 'Iconic Baroque cathedral with one of the world\'s largest domes',
    category: 'Cathedral',
    detailedDescription: 'St. Paul\'s Cathedral stands as one of London\'s most iconic buildings and a masterpiece of English Baroque architecture. Designed by Sir Christopher Wren after the Great Fire of London in 1666, the cathedral took 35 years to complete and was finished in 1710. Its magnificent dome, inspired by St. Peter\'s Basilica in Rome, rises 365 feet and remains one of the largest cathedral domes in the world. The cathedral has been the site of many significant events, including the funerals of Lord Nelson and Sir Winston Churchill, and the wedding of Prince Charles and Lady Diana Spencer.',
    photos: [
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800',
      'https://images.unsplash.com/photo-1543716021-36e0f757e6c9?w=800'
    ],
    historicalInfo: 'St. Paul\'s Cathedral was designed by Sir Christopher Wren after the Great Fire of London in 1666 and completed in 1710. It has been the site of many historic events including royal weddings and state funerals.',
    yearBuilt: '1675-1710',
    architect: 'Sir Christopher Wren',
    translations: {
      en: {
        name: 'St. Paul\'s Cathedral',
        narration: 'Welcome to St. Paul\'s Cathedral, Sir Christopher Wren\'s Baroque masterpiece. Its iconic dome has dominated London\'s skyline for over 300 years.',
        description: 'Iconic Baroque cathedral with one of the world\'s largest domes',
        historicalInfo: 'St. Paul\'s Cathedral was designed by Sir Christopher Wren after the Great Fire of London in 1666 and completed in 1710.',
        yearBuilt: '1675-1710',
        architect: 'Sir Christopher Wren'
      },
      it: {
        name: 'Cattedrale di St. Paul',
        narration: 'Benvenuti alla Cattedrale di St. Paul, il capolavoro barocco di Sir Christopher Wren. La sua iconica cupola domina lo skyline di Londra da oltre 300 anni.',
        description: 'Iconica cattedrale barocca con una delle cupole più grandi del mondo',
        historicalInfo: 'La Cattedrale di St. Paul fu progettata da Sir Christopher Wren dopo il Grande Incendio di Londra del 1666 e completata nel 1710.',
        yearBuilt: '1675-1710',
        architect: 'Sir Christopher Wren'
      },
      ko: {
        name: '세인트 폴 대성당',
        narration: '크리스토퍼 렌 경의 바로크 걸작 세인트 폴 대성당에 오신 것을 환영합니다. 그 상징적인 돔은 300년 넘게 런던의 스카이라인을 지배해 왔습니다.',
        description: '세계에서 가장 큰 돔 중 하나를 가진 상징적인 바로크 대성당',
        historicalInfo: '세인트 폴 대성당은 1666년 런던 대화재 이후 크리스토퍼 렌 경이 설계하여 1710년에 완공되었습니다.',
        yearBuilt: '1675-1710년',
        architect: '크리스토퍼 렌 경'
      }
    }
  },
  // Alaska landmarks
  {
    id: 'denali_national_park',
    cityId: 'anchorage',
    name: 'Denali National Park',
    lat: 63.1297,
    lng: -151.1974,
    radius: 100,
    narration: 'Welcome to Denali National Park, home to North America\'s tallest peak. This vast wilderness showcases Alaska\'s stunning natural beauty.',
    description: 'Six million acres of pristine wilderness surrounding North America\'s highest peak',
    category: 'National Park',
    detailedDescription: 'Denali National Park and Preserve encompasses six million acres of Alaska\'s most spectacular wilderness, dominated by the towering presence of Denali (formerly Mount McKinley), which at 20,310 feet is the highest peak in North America. The park offers an unparalleled opportunity to experience true wilderness, where grizzly bears roam freely, wolves hunt caribou, and Dall sheep navigate steep mountain terrain. Established in 1917, the park was originally created to protect the area\'s wildlife from overhunting. Today, it serves as one of the last great frontiers of the American wilderness. The park\'s diverse ecosystems range from low-elevation spruce and tamarack forests to high alpine tundra, supporting a remarkable variety of wildlife. Visitors can witness the midnight sun in summer, when daylight lasts nearly 24 hours, or the dancing Northern Lights in winter. The park\'s single road stretches 92 miles into its heart, offering stunning vistas of mountains, valleys, and wildlife. Only the first 15 miles are paved and accessible by private vehicles; beyond that, visitors must use shuttle buses, preserving the park\'s pristine character.',
    photos: [
      'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
      'https://images.unsplash.com/photo-1496714534174-7c9c5e7e8cd7?w=800'
    ],
    historicalInfo: 'Denali National Park was established in 1917 as Mount McKinley National Park to protect wildlife from commercial hunting. The park was designated an international biosphere reserve in 1976 and expanded to six million acres in 1980.',
    yearBuilt: '1917',
    architect: 'U.S. National Park Service',
    translations: {
      en: {
        name: 'Denali National Park',
        narration: 'Welcome to Denali National Park, home to North America\'s tallest peak. This vast wilderness showcases Alaska\'s stunning natural beauty.',
        description: 'Six million acres of pristine wilderness surrounding North America\'s highest peak',
        detailedDescription: 'Denali National Park and Preserve encompasses six million acres of Alaska\'s most spectacular wilderness, dominated by the towering presence of Denali (formerly Mount McKinley), which at 20,310 feet is the highest peak in North America. The park offers an unparalleled opportunity to experience true wilderness, where grizzly bears roam freely, wolves hunt caribou, and Dall sheep navigate steep mountain terrain. Established in 1917, the park was originally created to protect the area\'s wildlife from overhunting. Today, it serves as one of the last great frontiers of the American wilderness. The park\'s diverse ecosystems range from low-elevation spruce and tamarack forests to high alpine tundra, supporting a remarkable variety of wildlife. Visitors can witness the midnight sun in summer, when daylight lasts nearly 24 hours, or the dancing Northern Lights in winter. The park\'s single road stretches 92 miles into its heart, offering stunning vistas of mountains, valleys, and wildlife. Only the first 15 miles are paved and accessible by private vehicles; beyond that, visitors must use shuttle buses, preserving the park\'s pristine character.',
        historicalInfo: 'Denali National Park was established in 1917 as Mount McKinley National Park to protect wildlife from commercial hunting. The park was designated an international biosphere reserve in 1976 and expanded to six million acres in 1980.',
        yearBuilt: '1917',
        architect: 'U.S. National Park Service'
      },
      ko: {
        name: '데날리 국립공원',
        narration: '북미에서 가장 높은 봉우리가 있는 데날리 국립공원에 오신 것을 환영합니다. 이 광활한 야생지대는 알래스카의 놀라운 자연미를 보여줍니다.',
        description: '북미 최고봉을 둘러싼 600만 에이커의 원시 야생지대',
        detailedDescription: '데날리 국립공원은 600만 에이커의 알래스카에서 가장 장관을 이루는 야생지대를 아우르며, 북미에서 가장 높은 20,310피트의 봉우리인 데날리(과거 맥킨리산)가 우뚝 솟아 있습니다. 이 공원은 그리즐리곰이 자유롭게 돌아다니고, 늑대가 순록을 사냥하며, 달양이 가파른 산악 지형을 누비는 진정한 야생을 경험할 수 있는 비할 데 없는 기회를 제공합니다. 1917년에 설립된 이 공원은 원래 이 지역의 야생동물을 과잉 사냥으로부터 보호하기 위해 만들어졌습니다. 오늘날 이곳은 미국 야생의 마지막 위대한 개척지 중 하나입니다. 공원의 다양한 생태계는 저지대 가문비나무와 낙엽송 숲에서 고산 툰드라에 이르기까지 다양하며 놀라운 다양성의 야생동물을 지원합니다. 방문객들은 여름에는 거의 24시간 지속되는 백야를, 겨울에는 춤추는 오로라를 목격할 수 있습니다. 공원의 유일한 도로는 92마일을 뻗어 산, 계곡, 야생동물의 멋진 전망을 제공합니다. 처음 15마일만 포장되어 개인 차량으로 접근할 수 있으며, 그 너머는 셔틀버스를 이용해야 공원의 원시적 특성을 보존할 수 있습니다.',
        historicalInfo: '데날리 국립공원은 1917년 맥킨리산 국립공원으로 설립되어 야생동물을 상업적 사냥으로부터 보호했습니다. 1976년에 국제 생물권 보호구역으로 지정되었으며 1980년에 600만 에이커로 확장되었습니다.',
        yearBuilt: '1917년',
        architect: '미국 국립공원 관리청'
      },
      ja: {
        name: 'デナリ国立公園',
        narration: '北米最高峰を擁するデナリ国立公園へようこそ。この広大な原生地域はアラスカの見事な自然美を見せています。',
        description: '北米最高峰を囲む600万エーカーの原生自然',
        detailedDescription: 'デナリ国立公園は、北米最高峰である20,310フィートのデナリ(旧マッキンリー山)がそびえ立つ、アラスカで最も壮観な600万エーカーの原生地域を包含しています。この公園は、グリズリーベアが自由に歩き回り、オオカミがカリブーを狩り、ドールシープが急峻な山岳地形を移動する真の原生自然を体験する比類のない機会を提供します。1917年に設立されたこの公園は、元々この地域の野生生物を過剰狩猟から保護するために作られました。今日、ここはアメリカの原生地域の最後の偉大なフロンティアの一つです。公園の多様な生態系は、低地のトウヒとカラマツの森林から高山ツンドラまで及び、驚くべき多様な野生生物を支えています。訪問者は夏には昼間がほぼ24時間続く白夜を、冬には踊るオーロラを目撃できます。公園の唯一の道路は92マイル延びて、山、谷、野生生物の見事な景色を提供します。最初の15マイルだけが舗装され個人車両でアクセスできます。それ以降はシャトルバスを使用する必要があり、公園の原始的な特性を保存しています。',
        historicalInfo: 'デナリ国立公園は1917年にマッキンリー山国立公園として設立され、野生生物を商業狩猟から保護しました。1976年に国際生物圏保護区に指定され、1980年に600万エーカーに拡大されました。',
        yearBuilt: '1917年',
        architect: '米国国立公園局'
      },
      zh: {
        name: '德纳里国家公园',
        narration: '欢迎来到德纳里国家公园,北美最高峰的所在地。这片广阔的荒野展示了阿拉斯加惊人的自然美景。',
        description: '环绕北美最高峰的600万英亩原始荒野',
        detailedDescription: '德纳里国家公园占地600万英亩,是阿拉斯加最壮观的荒野,以高达20,310英尺的北美最高峰德纳里(前称麦金利山)为主导。公园提供了体验真正荒野的无与伦比的机会,灰熊自由漫步,狼群狩猎驯鹿,戴尔羊在陡峭的山地穿行。该公园成立于1917年,最初是为了保护该地区的野生动物免受过度狩猎。今天,它是美国荒野最后的伟大边疆之一。公园的多样化生态系统从低海拔的云杉和落叶松林延伸到高山苔原,支持着种类繁多的野生动物。游客可以在夏季目睹几乎持续24小时的午夜阳光,或在冬季观赏舞动的北极光。公园唯一的道路延伸92英里进入腹地,提供山脉、峡谷和野生动物的壮丽景色。只有前15英里是铺装的,可供私人车辆通行;再往前必须使用班车,以保护公园的原始特性。',
        historicalInfo: '德纳里国家公园于1917年作为麦金利山国家公园成立,以保护野生动物免受商业狩猎。该公园于1976年被指定为国际生物圈保护区,并于1980年扩大至600万英亩。',
        yearBuilt: '1917年',
        architect: '美国国家公园管理局'
      }
    }
  },
  {
    id: 'mendenhall_glacier',
    cityId: 'anchorage',
    name: 'Mendenhall Glacier',
    lat: 58.441667,
    lng: -134.545833,
    radius: 80,
    narration: 'Behold the magnificent Mendenhall Glacier, a 13-mile river of ice flowing from the Juneau Icefield. Witness the stunning blue ice and majestic landscape.',
    description: 'A stunning 13-mile glacier accessible by road in Southeast Alaska',
    category: 'Natural Wonder',
    detailedDescription: 'Mendenhall Glacier is one of Alaska\'s most accessible and spectacular glaciers, stretching approximately 13.6 miles from its source in the Juneau Icefield to its terminus at Mendenhall Lake. Located just 12 miles from downtown Juneau, it\'s the only glacier in Southeast Alaska accessible by road, making it a must-visit destination for thousands of visitors each year. The glacier showcases the dramatic power of ice, with its brilliant blue hues created by compressed ice that absorbs all colors of light except blue. The glacier is part of the Tongass National Forest and sits within the 5,815-acre Mendenhall Glacier Recreation Area. Visitors can explore numerous trails offering different perspectives of the glacier, from the easy Photo Point Trail to the more challenging West Glacier Trail that brings hikers to the glacier\'s edge. The visitor center provides educational exhibits about glacial formation, climate change, and local wildlife. Like many glaciers worldwide, Mendenhall has been retreating due to climate change, providing a visible reminder of our changing planet.',
    photos: [
      'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
      'https://images.unsplash.com/photo-1496714534174-7c9c5e7e8cd7?w=800'
    ],
    historicalInfo: 'Mendenhall Glacier was named after Thomas Corwin Mendenhall, who was the superintendent of the U.S. Coast and Geodetic Survey from 1889 to 1894. The glacier has been retreating since the mid-1700s and has retreated approximately 2.5 miles since 1929.',
    yearBuilt: 'Formed thousands of years ago',
    architect: 'Natural Formation',
    translations: {
      en: {
        name: 'Mendenhall Glacier',
        narration: 'Behold the magnificent Mendenhall Glacier, a 13-mile river of ice flowing from the Juneau Icefield. Witness the stunning blue ice and majestic landscape.',
        description: 'A stunning 13-mile glacier accessible by road in Southeast Alaska',
        detailedDescription: 'Mendenhall Glacier is one of Alaska\'s most accessible and spectacular glaciers, stretching approximately 13.6 miles from its source in the Juneau Icefield to its terminus at Mendenhall Lake. Located just 12 miles from downtown Juneau, it\'s the only glacier in Southeast Alaska accessible by road, making it a must-visit destination for thousands of visitors each year. The glacier showcases the dramatic power of ice, with its brilliant blue hues created by compressed ice that absorbs all colors of light except blue. The glacier is part of the Tongass National Forest and sits within the 5,815-acre Mendenhall Glacier Recreation Area. Visitors can explore numerous trails offering different perspectives of the glacier, from the easy Photo Point Trail to the more challenging West Glacier Trail that brings hikers to the glacier\'s edge. The visitor center provides educational exhibits about glacial formation, climate change, and local wildlife. Like many glaciers worldwide, Mendenhall has been retreating due to climate change, providing a visible reminder of our changing planet.',
        historicalInfo: 'Mendenhall Glacier was named after Thomas Corwin Mendenhall, who was the superintendent of the U.S. Coast and Geodetic Survey from 1889 to 1894. The glacier has been retreating since the mid-1700s and has retreated approximately 2.5 miles since 1929.',
        yearBuilt: 'Formed thousands of years ago',
        architect: 'Natural Formation'
      },
      ko: {
        name: '멘덴홀 빙하',
        narration: '주노 빙원에서 흘러내리는 13마일의 얼음 강인 장엄한 멘덴홀 빙하를 목격하세요. 놀라운 푸른 얼음과 장엄한 풍경을 감상하세요.',
        description: '동남 알래스카에서 도로로 접근 가능한 멋진 13마일 빙하',
        detailedDescription: '멘덴홀 빙하는 알래스카에서 가장 접근하기 쉽고 장관을 이루는 빙하 중 하나로, 주노 빙원의 수원에서 멘덴홀 호수의 끝까지 약 13.6마일 뻗어 있습니다. 주노 시내에서 불과 12마일 떨어진 곳에 위치한 이곳은 동남 알래스카에서 도로로 접근 가능한 유일한 빙하로, 매년 수천 명의 방문객이 찾는 필수 방문지입니다. 빙하는 얼음의 극적인 힘을 보여주며, 파란색을 제외한 모든 빛의 색을 흡수하는 압축된 얼음으로 만들어진 찬란한 푸른 색조를 띠고 있습니다. 빙하는 통가스 국유림의 일부이며 5,815에이커의 멘덴홀 빙하 레크리에이션 지역 내에 위치합니다. 방문객들은 쉬운 포토 포인트 트레일부터 하이커들을 빙하 가장자리로 안내하는 더 도전적인 웨스트 글레이셔 트레일까지 빙하의 다양한 관점을 제공하는 수많은 트레일을 탐험할 수 있습니다. 방문자 센터는 빙하 형성, 기후 변화 및 지역 야생동물에 대한 교육 전시를 제공합니다. 전 세계의 많은 빙하와 마찬가지로 멘덴홀은 기후 변화로 인해 후퇴하고 있어 우리 행성의 변화를 가시적으로 상기시켜 줍니다.',
        historicalInfo: '멘덴홀 빙하는 1889년부터 1894년까지 미국 해안 및 측지 조사국 국장이었던 토마스 코윈 멘덴홀의 이름을 따서 명명되었습니다. 빙하는 1700년대 중반부터 후퇴해 왔으며 1929년 이후 약 2.5마일 후퇴했습니다.',
        yearBuilt: '수천 년 전 형성',
        architect: '자연 형성물'
      },
      ja: {
        name: 'メンデンホール氷河',
        narration: 'ジュノー氷原から流れる13マイルの氷の川、壮大なメンデンホール氷河をご覧ください。見事な青い氷と雄大な景観を目撃してください。',
        description: '南東アラスカで道路でアクセス可能な見事な13マイルの氷河',
        detailedDescription: 'メンデンホール氷河はアラスカで最もアクセスしやすく壮観な氷河の一つで、ジュノー氷原の源から メンデンホール湖の終点まで約13.6マイル延びています。ジュノーのダウンタウンからわずか12マイルの場所に位置し、南東アラスカで道路でアクセスできる唯一の氷河であるため、毎年何千人もの訪問者にとって必見の目的地となっています。氷河は氷の劇的な力を示し、青以外のすべての光の色を吸収する圧縮された氷によって作り出される鮮やかな青色の色合いを特徴としています。氷河はトンガス国有林の一部であり、5,815エーカーのメンデンホール氷河レクリエーションエリア内に位置しています。訪問者は、簡単なフォトポイントトレイルから、ハイカーを氷河の端に連れて行くより困難なウェストグレイシャートレイルまで、氷河のさまざまな視点を提供する数多くのトレイルを探索できます。ビジターセンターは、氷河の形成、気候変動、地元の野生生物に関する教育展示を提供しています。世界中の多くの氷河と同様に、メンデンホールは気候変動のために後退しており、私たちの変化する地球の目に見える思い出させるものを提供しています。',
        historicalInfo: 'メンデンホール氷河は、1889年から1894年まで米国沿岸測地調査所の監督官だったトーマス・コーウィン・メンデンホールにちなんで命名されました。氷河は1700年代半ばから後退しており、1929年以来約2.5マイル後退しています。',
        yearBuilt: '数千年前に形成',
        architect: '自然形成物'
      },
      zh: {
        name: '门登霍尔冰川',
        narration: '欣赏壮丽的门登霍尔冰川,一条从朱诺冰原流出的13英里冰河。见证令人惊叹的蓝色冰川和雄伟的景观。',
        description: '东南阿拉斯加可通过公路到达的壮观13英里冰川',
        detailedDescription: '门登霍尔冰川是阿拉斯加最易到达且最壮观的冰川之一,从朱诺冰原的源头延伸约13.6英里至门登霍尔湖的终点。它距朱诺市中心仅12英里,是东南阿拉斯加唯一可通过公路到达的冰川,成为每年数千名游客的必游目的地。冰川展示了冰的戏剧性力量,其璀璨的蓝色是由压缩冰吸收除蓝色外所有光色而产生的。冰川是通加斯国家森林的一部分,位于5,815英亩的门登霍尔冰川游憩区内。游客可以探索众多提供不同冰川视角的步道,从简单的照片点步道到更具挑战性的西冰川步道,后者将徒步者带到冰川边缘。游客中心提供关于冰川形成、气候变化和当地野生动物的教育展览。与世界上许多冰川一样,门登霍尔冰川由于气候变化而在后退,为我们不断变化的星球提供了可见的提醒。',
        historicalInfo: '门登霍尔冰川以托马斯·科温·门登霍尔命名,他在1889年至1894年担任美国海岸和大地测量局局长。冰川自1700年代中期以来一直在后退,自1929年以来已后退约2.5英里。',
        yearBuilt: '数千年前形成',
        architect: '自然形成'
      }
    }
  },
  {
    id: 'alaska_wildlife_center',
    cityId: 'anchorage',
    name: 'Alaska Wildlife Conservation Center',
    lat: 60.821359,
    lng: -148.978592,
    radius: 70,
    narration: 'Visit the Alaska Wildlife Conservation Center, a sanctuary dedicated to preserving Alaska\'s native wildlife through conservation, education, and quality animal care.',
    description: 'A 200-acre wildlife sanctuary protecting Alaska\'s native species',
    category: 'Wildlife Sanctuary',
    detailedDescription: 'The Alaska Wildlife Conservation Center is a 200-acre non-profit sanctuary located in Portage Valley, dedicated to the conservation of Alaska\'s wildlife through education, research, and quality animal care. Founded in 1993, the center provides a safe haven for orphaned, injured, and ill animals that cannot be released back into the wild. Visitors can observe majestic Alaska brown bears, massive wood bison, elusive wolves, powerful moose, and many other native Alaskan species in spacious, naturalistic habitats. The center plays a crucial role in conservation efforts, including the successful reintroduction of wood bison to Alaska after their extinction in the state. The self-guided 1.5-mile loop allows visitors to experience wildlife viewing by foot, car, or bicycle, with educational signs providing fascinating insights into each species\' behavior, habitat, and conservation status. The center also participates in breeding programs for endangered species and provides educational programs for thousands of school children and visitors annually.',
    photos: [
      'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
      'https://images.unsplash.com/photo-1496714534174-7c9c5e7e8cd7?w=800'
    ],
    historicalInfo: 'The Alaska Wildlife Conservation Center was founded in 1993 by Mike Miller as a sanctuary for orphaned and injured wildlife. The center has since become a leader in wildlife conservation, successfully reintroducing wood bison to Alaska in 2015 after their local extinction.',
    yearBuilt: '1993',
    architect: 'Mike Miller (Founder)',
    translations: {
      en: {
        name: 'Alaska Wildlife Conservation Center',
        narration: 'Visit the Alaska Wildlife Conservation Center, a sanctuary dedicated to preserving Alaska\'s native wildlife through conservation, education, and quality animal care.',
        description: 'A 200-acre wildlife sanctuary protecting Alaska\'s native species',
        detailedDescription: 'The Alaska Wildlife Conservation Center is a 200-acre non-profit sanctuary located in Portage Valley, dedicated to the conservation of Alaska\'s wildlife through education, research, and quality animal care. Founded in 1993, the center provides a safe haven for orphaned, injured, and ill animals that cannot be released back into the wild. Visitors can observe majestic Alaska brown bears, massive wood bison, elusive wolves, powerful moose, and many other native Alaskan species in spacious, naturalistic habitats. The center plays a crucial role in conservation efforts, including the successful reintroduction of wood bison to Alaska after their extinction in the state. The self-guided 1.5-mile loop allows visitors to experience wildlife viewing by foot, car, or bicycle, with educational signs providing fascinating insights into each species\' behavior, habitat, and conservation status. The center also participates in breeding programs for endangered species and provides educational programs for thousands of school children and visitors annually.',
        historicalInfo: 'The Alaska Wildlife Conservation Center was founded in 1993 by Mike Miller as a sanctuary for orphaned and injured wildlife. The center has since become a leader in wildlife conservation, successfully reintroducing wood bison to Alaska in 2015 after their local extinction.',
        yearBuilt: '1993',
        architect: 'Mike Miller (Founder)'
      },
      ko: {
        name: '알래스카 야생동물 보호센터',
        narration: '보존, 교육 및 양질의 동물 관리를 통해 알래스카의 토착 야생동물을 보호하는 데 전념하는 보호구역인 알래스카 야생동물 보호센터를 방문하세요.',
        description: '알래스카 토착 종을 보호하는 200에이커 야생동물 보호구역',
        detailedDescription: '알래스카 야생동물 보호센터는 포티지 밸리에 위치한 200에이커의 비영리 보호구역으로, 교육, 연구 및 양질의 동물 관리를 통해 알래스카 야생동물 보존에 전념하고 있습니다. 1993년에 설립된 이 센터는 야생으로 돌아갈 수 없는 고아, 부상 및 병든 동물들을 위한 안전한 피난처를 제공합니다. 방문객들은 웅장한 알래스카 갈색곰, 거대한 우드 들소, 포착하기 어려운 늑대, 강력한 무스 및 기타 많은 알래스카 토착 종들을 넓고 자연적인 서식지에서 관찰할 수 있습니다. 센터는 주에서 멸종된 후 알래스카에 우드 들소를 성공적으로 재도입하는 것을 포함하여 보존 노력에서 중요한 역할을 합니다. 셀프 가이드 1.5마일 루프를 통해 방문객들은 도보, 자동차 또는 자전거로 야생동물을 관찰할 수 있으며, 교육 표지판은 각 종의 행동, 서식지 및 보존 상태에 대한 매혹적인 통찰력을 제공합니다. 센터는 또한 멸종 위기종 번식 프로그램에 참여하고 매년 수천 명의 학생과 방문객을 위한 교육 프로그램을 제공합니다.',
        historicalInfo: '알래스카 야생동물 보호센터는 1993년 마이크 밀러에 의해 고아 및 부상당한 야생동물을 위한 보호구역으로 설립되었습니다. 센터는 이후 야생동물 보존의 선두주자가 되어 2015년 지역 멸종 후 알래스카에 우드 들소를 성공적으로 재도입했습니다.',
        yearBuilt: '1993년',
        architect: '마이크 밀러 (설립자)'
      },
      ja: {
        name: 'アラスカ野生動物保護センター',
        narration: '保護、教育、質の高い動物ケアを通じてアラスカの在来野生動物の保護に専念する保護区、アラスカ野生動物保護センターを訪れてください。',
        description: 'アラスカの在来種を保護する200エーカーの野生動物保護区',
        detailedDescription: 'アラスカ野生動物保護センターは、ポーテージバレーに位置する200エーカーの非営利保護区で、教育、研究、質の高い動物ケアを通じてアラスカの野生動物の保護に専念しています。1993年に設立されたこのセンターは、野生に戻すことができない孤児、負傷、病気の動物のための安全な避難所を提供しています。訪問者は、雄大なアラスカヒグマ、巨大なウッドバイソン、とらえどころのないオオカミ、強力なヘラジカ、その他多くのアラスカ在来種を広々とした自然の生息地で観察できます。センターは、州で絶滅した後のアラスカへのウッドバイソンの成功した再導入を含む保護活動において重要な役割を果たしています。セルフガイド式の1.5マイルのループにより、訪問者は徒歩、車、または自転車で野生動物の観察を体験でき、教育標識は各種の行動、生息地、保護状況についての魅力的な洞察を提供します。センターはまた、絶滅危惧種の繁殖プログラムに参加し、毎年何千人もの学童や訪問者のための教育プログラムを提供しています。',
        historicalInfo: 'アラスカ野生動物保護センターは1993年にマイク・ミラーによって孤児や負傷した野生動物のための保護区として設立されました。センターはその後、野生動物保護のリーダーとなり、2015年に地域絶滅後のアラスカへのウッドバイソンの再導入に成功しました。',
        yearBuilt: '1993年',
        architect: 'マイク・ミラー (設立者)'
      },
      zh: {
        name: '阿拉斯加野生动物保护中心',
        narration: '参观阿拉斯加野生动物保护中心,这是一个致力于通过保护、教育和优质动物护理来保护阿拉斯加本土野生动物的保护区。',
        description: '保护阿拉斯加本土物种的200英亩野生动物保护区',
        detailedDescription: '阿拉斯加野生动物保护中心是位于波蒂奇谷的一个200英亩的非营利保护区,致力于通过教育、研究和优质动物护理来保护阿拉斯加的野生动物。该中心成立于1993年,为无法放归野外的孤儿、受伤和生病的动物提供安全避风港。游客可以在宽敞的自然栖息地观察雄伟的阿拉斯加棕熊、巨大的森林野牛、难以捉摸的狼、强大的驼鹿以及许多其他阿拉斯加本土物种。该中心在保护工作中发挥着关键作用,包括在该州灭绝后成功将森林野牛重新引入阿拉斯加。自助式1.5英里环路允许游客步行、开车或骑自行车观察野生动物,教育标志提供关于每个物种行为、栖息地和保护状况的迷人见解。该中心还参与濒危物种繁殖计划,每年为数千名学生和游客提供教育项目。',
        historicalInfo: '阿拉斯加野生动物保护中心由迈克·米勒于1993年创立,作为孤儿和受伤野生动物的保护区。该中心后来成为野生动物保护的领导者,在当地灭绝后于2015年成功将森林野牛重新引入阿拉斯加。',
        yearBuilt: '1993年',
        architect: '迈克·米勒 (创始人)'
      }
    }
  },
  {
    id: 'anchorage_museum',
    cityId: 'anchorage',
    name: 'Anchorage Museum',
    lat: 61.217649,
    lng: -149.886149,
    radius: 50,
    narration: 'Explore the Anchorage Museum, Alaska\'s largest museum featuring world-class art, history, science, and Alaska Native culture in the heart of downtown.',
    description: 'Alaska\'s largest museum showcasing art, history, and culture',
    category: 'Museum',
    detailedDescription: 'The Anchorage Museum is Alaska\'s premier cultural institution, offering a comprehensive exploration of the state\'s art, history, science, and Alaska Native heritage. Located in downtown Anchorage at 625 C Street, the museum features over 170,000 square feet of gallery space across multiple floors. The Smithsonian Arctic Studies Center houses one of the finest collections of Alaska Native artifacts in the world, while the art galleries showcase both historical and contemporary works from Alaska and circumpolar regions. The museum\'s innovative exhibitions blend traditional museum experiences with cutting-edge technology, including the Imaginarium Discovery Center where visitors can engage in hands-on science exploration. Special exhibits rotate throughout the year, covering topics from Arctic exploration to climate change, from traditional crafts to contemporary Indigenous art. The museum also features a planetarium, research library, and multiple dining options. As a cultural hub, it hosts concerts, lectures, and community events, making it a vital center for learning and cultural exchange in Alaska.',
    photos: [
      'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
      'https://images.unsplash.com/photo-1496714534174-7c9c5e7e8cd7?w=800'
    ],
    historicalInfo: 'The Anchorage Museum was founded in 1968 with just 60 artifacts and 2,500 square feet of space. It has since grown into Alaska\'s largest museum, expanding multiple times with the most recent major renovation completed in 2017, adding the Smithsonian Arctic Studies Center.',
    yearBuilt: '1968',
    architect: 'Various architects through expansions',
    translations: {
      en: {
        name: 'Anchorage Museum',
        narration: 'Explore the Anchorage Museum, Alaska\'s largest museum featuring world-class art, history, science, and Alaska Native culture in the heart of downtown.',
        description: 'Alaska\'s largest museum showcasing art, history, and culture',
        detailedDescription: 'The Anchorage Museum is Alaska\'s premier cultural institution, offering a comprehensive exploration of the state\'s art, history, science, and Alaska Native heritage. Located in downtown Anchorage at 625 C Street, the museum features over 170,000 square feet of gallery space across multiple floors. The Smithsonian Arctic Studies Center houses one of the finest collections of Alaska Native artifacts in the world, while the art galleries showcase both historical and contemporary works from Alaska and circumpolar regions. The museum\'s innovative exhibitions blend traditional museum experiences with cutting-edge technology, including the Imaginarium Discovery Center where visitors can engage in hands-on science exploration. Special exhibits rotate throughout the year, covering topics from Arctic exploration to climate change, from traditional crafts to contemporary Indigenous art. The museum also features a planetarium, research library, and multiple dining options. As a cultural hub, it hosts concerts, lectures, and community events, making it a vital center for learning and cultural exchange in Alaska.',
        historicalInfo: 'The Anchorage Museum was founded in 1968 with just 60 artifacts and 2,500 square feet of space. It has since grown into Alaska\'s largest museum, expanding multiple times with the most recent major renovation completed in 2017, adding the Smithsonian Arctic Studies Center.',
        yearBuilt: '1968',
        architect: 'Various architects through expansions'
      },
      ko: {
        name: '앵커리지 박물관',
        narration: '시내 중심부에서 세계적 수준의 예술, 역사, 과학 및 알래스카 원주민 문화를 선보이는 알래스카 최대 박물관인 앵커리지 박물관을 탐험하세요.',
        description: '예술, 역사, 문화를 선보이는 알래스카 최대 박물관',
        detailedDescription: '앵커리지 박물관은 알래스카의 주요 문화 기관으로, 주의 예술, 역사, 과학 및 알래스카 원주민 유산에 대한 포괄적인 탐험을 제공합니다. 앵커리지 시내 625 C 스트리트에 위치한 이 박물관은 여러 층에 걸쳐 170,000평방피트 이상의 갤러리 공간을 갖추고 있습니다. 스미소니언 북극 연구 센터는 세계에서 가장 훌륭한 알래스카 원주민 유물 컬렉션 중 하나를 보유하고 있으며, 미술 갤러리는 알래스카와 극지방 지역의 역사적 및 현대적 작품을 모두 전시합니다. 박물관의 혁신적인 전시는 전통적인 박물관 경험과 최첨단 기술을 혼합하며, 방문객들이 직접 체험하는 과학 탐험에 참여할 수 있는 이매지내리엄 디스커버리 센터를 포함합니다. 특별 전시는 일년 내내 순환되며, 북극 탐험에서 기후 변화, 전통 공예에서 현대 원주민 예술에 이르는 주제를 다룹니다. 박물관은 또한 플라네타륨, 연구 도서관 및 여러 식사 옵션을 갖추고 있습니다. 문화 허브로서 콘서트, 강연 및 커뮤니티 행사를 개최하여 알래스카에서 학습과 문화 교류를 위한 필수 센터가 되고 있습니다.',
        historicalInfo: '앵커리지 박물관은 1968년 단지 60개의 유물과 2,500평방피트의 공간으로 설립되었습니다. 이후 알래스카 최대 박물관으로 성장했으며, 여러 차례 확장을 거쳐 2017년에 완료된 가장 최근의 주요 리노베이션으로 스미소니언 북극 연구 센터가 추가되었습니다.',
        yearBuilt: '1968년',
        architect: '확장을 통한 다양한 건축가'
      },
      ja: {
        name: 'アンカレッジ博物館',
        narration: 'ダウンタウンの中心部にある、世界クラスのアート、歴史、科学、アラスカ先住民文化を特集するアラスカ最大の博物館、アンカレッジ博物館を探索してください。',
        description: 'アート、歴史、文化を展示するアラスカ最大の博物館',
        detailedDescription: 'アンカレッジ博物館はアラスカの主要な文化機関であり、州のアート、歴史、科学、アラスカ先住民の遺産の包括的な探求を提供しています。ダウンタウンアンカレッジの625 Cストリートに位置し、複数階にわたって170,000平方フィート以上のギャラリースペースを備えています。スミソニアン北極研究センターは世界で最も優れたアラスカ先住民の遺物コレクションの一つを所蔵しており、アートギャラリーはアラスカと極地域からの歴史的および現代的作品の両方を展示しています。博物館の革新的な展示は、訪問者が実践的な科学探求に参加できるイマジナリウムディスカバリーセンターを含む、従来の博物館体験と最先端技術を融合させています。特別展示は年間を通じて入れ替わり、北極探検から気候変動、伝統工芸から現代先住民アートまでのトピックをカバーしています。博物館にはプラネタリウム、研究図書館、複数の食事オプションもあります。文化的ハブとして、コンサート、講演、コミュニティイベントを開催し、アラスカにおける学習と文化交流の重要なセンターとなっています。',
        historicalInfo: 'アンカレッジ博物館は1968年にわずか60の遺物と2,500平方フィートのスペースで設立されました。その後、アラスカ最大の博物館に成長し、複数回の拡張を経て、2017年に完成した最新の大規模改修でスミソニアン北極研究センターが追加されました。',
        yearBuilt: '1968年',
        architect: '拡張を通じた様々な建築家'
      },
      zh: {
        name: '安克雷奇博物馆',
        narration: '探索安克雷奇博物馆,阿拉斯加最大的博物馆,在市中心展示世界级艺术、历史、科学和阿拉斯加原住民文化。',
        description: '展示艺术、历史和文化的阿拉斯加最大博物馆',
        detailedDescription: '安克雷奇博物馆是阿拉斯加首屈一指的文化机构,提供对该州艺术、历史、科学和阿拉斯加原住民遗产的全面探索。博物馆位于安克雷奇市中心C街625号,拥有超过170,000平方英尺的多层画廊空间。史密森尼北极研究中心收藏着世界上最精美的阿拉斯加原住民文物之一,而艺术画廊展示了来自阿拉斯加和环极地区的历史和当代作品。博物馆的创新展览将传统博物馆体验与尖端技术相结合,包括想象探索中心,游客可以在那里参与动手科学探索。特别展览全年轮换,涵盖从北极探险到气候变化,从传统工艺到当代原住民艺术等主题。博物馆还设有天文馆、研究图书馆和多个餐饮选择。作为文化中心,它举办音乐会、讲座和社区活动,使其成为阿拉斯加学习和文化交流的重要中心。',
        historicalInfo: '安克雷奇博物馆成立于1968年,最初只有60件文物和2,500平方英尺的空间。此后发展成为阿拉斯加最大的博物馆,多次扩建,最近一次重大翻新于2017年完成,增加了史密森尼北极研究中心。',
        yearBuilt: '1968年',
        architect: '通过扩建的各种建筑师'
      }
    }
  },
  {
    id: 'kenai_fjords',
    cityId: 'anchorage',
    name: 'Kenai Fjords National Park',
    lat: 59.909722,
    lng: -149.642778,
    radius: 70,
    narration: 'Discover Kenai Fjords National Park, where massive tidewater glaciers meet the sea, creating a dramatic landscape of ice, rock, and abundant marine wildlife.',
    description: 'Spectacular coastal park featuring tidewater glaciers and marine wildlife',
    category: 'National Park',
    detailedDescription: 'Kenai Fjords National Park protects 669,984 acres of coastal wilderness on Alaska\'s Kenai Peninsula, where the Harding Icefield feeds nearly 40 glaciers that flow down to meet the sea. The park is named for the numerous fjords carved by these glaciers over thousands of years. Exit Glacier, the park\'s most accessible glacier, offers visitors a rare opportunity to walk right up to the face of a glacier and witness the dramatic effects of climate change as it continues to retreat. Boat tours through the fjords provide spectacular views of tidewater glaciers calving massive chunks of ice into the ocean, while also offering chances to see orcas, humpback whales, sea otters, puffins, and sea lions in their natural habitat. The park\'s coastal environment supports a rich diversity of marine and terrestrial wildlife. The Harding Icefield, one of only four remaining icefields in the United States, covers an area of approximately 700 square miles and can be reached via a challenging 8.2-mile round-trip hike that rewards visitors with breathtaking views of this vast expanse of ice.',
    photos: [
      'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
      'https://images.unsplash.com/photo-1496714534174-7c9c5e7e8cd7?w=800'
    ],
    historicalInfo: 'Kenai Fjords National Park was established in 1980 as part of the Alaska National Interest Lands Conservation Act. The park\'s landscape has been shaped by glacial activity for thousands of years, with the Harding Icefield being a remnant of the last ice age.',
    yearBuilt: '1980',
    architect: 'U.S. National Park Service',
    translations: {
      en: {
        name: 'Kenai Fjords National Park',
        narration: 'Discover Kenai Fjords National Park, where massive tidewater glaciers meet the sea, creating a dramatic landscape of ice, rock, and abundant marine wildlife.',
        description: 'Spectacular coastal park featuring tidewater glaciers and marine wildlife',
        detailedDescription: 'Kenai Fjords National Park protects 669,984 acres of coastal wilderness on Alaska\'s Kenai Peninsula, where the Harding Icefield feeds nearly 40 glaciers that flow down to meet the sea. The park is named for the numerous fjords carved by these glaciers over thousands of years. Exit Glacier, the park\'s most accessible glacier, offers visitors a rare opportunity to walk right up to the face of a glacier and witness the dramatic effects of climate change as it continues to retreat. Boat tours through the fjords provide spectacular views of tidewater glaciers calving massive chunks of ice into the ocean, while also offering chances to see orcas, humpback whales, sea otters, puffins, and sea lions in their natural habitat. The park\'s coastal environment supports a rich diversity of marine and terrestrial wildlife. The Harding Icefield, one of only four remaining icefields in the United States, covers an area of approximately 700 square miles and can be reached via a challenging 8.2-mile round-trip hike that rewards visitors with breathtaking views of this vast expanse of ice.',
        historicalInfo: 'Kenai Fjords National Park was established in 1980 as part of the Alaska National Interest Lands Conservation Act. The park\'s landscape has been shaped by glacial activity for thousands of years, with the Harding Icefield being a remnant of the last ice age.',
        yearBuilt: '1980',
        architect: 'U.S. National Park Service'
      },
      ko: {
        name: '키나이 피오르드 국립공원',
        narration: '거대한 조수 빙하가 바다와 만나 얼음, 바위, 풍부한 해양 야생동물의 극적인 풍경을 만드는 키나이 피오르드 국립공원을 발견하세요.',
        description: '조수 빙하와 해양 야생동물을 특징으로 하는 장관을 이루는 해안 공원',
        detailedDescription: '키나이 피오르드 국립공원은 알래스카 키나이 반도에서 669,984에이커의 해안 야생지대를 보호하며, 하딩 빙원이 바다로 흘러내리는 거의 40개의 빙하를 공급합니다. 공원은 수천 년에 걸쳐 이러한 빙하가 조각한 수많은 피오르드의 이름을 따서 명명되었습니다. 공원에서 가장 접근하기 쉬운 빙하인 엑시트 빙하는 방문객들에게 빙하의 전면까지 걸어갈 수 있는 드문 기회를 제공하며 계속 후퇴하면서 기후 변화의 극적인 영향을 목격할 수 있습니다. 피오르드를 통한 보트 투어는 조수 빙하가 거대한 얼음 덩어리를 바다로 떨어뜨리는 장관을 보여주며, 범고래, 혹등고래, 해달, 퍼핀, 바다사자를 자연 서식지에서 볼 수 있는 기회도 제공합니다. 공원의 해안 환경은 풍부한 다양성의 해양 및 육상 야생동물을 지원합니다. 미국에 남아있는 단 4개의 빙원 중 하나인 하딩 빙원은 약 700평방마일의 면적을 차지하며 방문객들에게 이 광대한 얼음 확장의 숨막히는 경치를 보상하는 도전적인 8.2마일 왕복 하이킹을 통해 도달할 수 있습니다.',
        historicalInfo: '키나이 피오르드 국립공원은 1980년 알래스카 국가 이익 토지 보존법의 일부로 설립되었습니다. 공원의 풍경은 수천 년 동안 빙하 활동에 의해 형성되었으며, 하딩 빙원은 마지막 빙하기의 잔재입니다.',
        yearBuilt: '1980년',
        architect: '미국 국립공원 관리청'
      },
      ja: {
        name: 'ケナイフィヨルド国立公園',
        narration: '巨大な潮水氷河が海と出会い、氷、岩、豊富な海洋野生生物の劇的な景観を作り出すケナイフィヨルド国立公園を発見してください。',
        description: '潮水氷河と海洋野生生物を特徴とする壮観な海岸公園',
        detailedDescription: 'ケナイフィヨルド国立公園は、アラスカのケナイ半島で669,984エーカーの海岸荒野を保護しており、ハーディング氷原が海に流れ込む約40の氷河を供給しています。公園は、これらの氷河が数千年にわたって刻んだ多数のフィヨルドにちなんで名付けられました。公園で最もアクセスしやすい氷河であるイグジット氷河は、訪問者に氷河の前面まで歩いて行き、後退し続ける気候変動の劇的な影響を目撃する稀な機会を提供します。フィヨルドを通るボートツアーは、潮水氷河が巨大な氷の塊を海に落とす壮観な景色を提供し、シャチ、ザトウクジラ、ラッコ、パフィン、アシカを自然の生息地で見る機会も提供します。公園の海岸環境は、豊富な多様性の海洋および陸生野生生物を支えています。米国に残る4つの氷原の一つであるハーディング氷原は、約700平方マイルの面積をカバーし、訪問者にこの広大な氷の広がりの息をのむような景色を報酬として与える挑戦的な8.2マイルの往復ハイキングを通じて到達できます。',
        historicalInfo: 'ケナイフィヨルド国立公園は1980年にアラスカ国家利益土地保全法の一部として設立されました。公園の景観は数千年にわたって氷河活動によって形成され、ハーディング氷原は最後の氷河期の名残です。',
        yearBuilt: '1980年',
        architect: '米国国立公園局'
      },
      zh: {
        name: '基奈峡湾国家公园',
        narration: '发现基奈峡湾国家公园,巨大的潮水冰川与海洋相遇,创造出冰、岩石和丰富海洋野生动物的壮观景观。',
        description: '以潮水冰川和海洋野生动物为特色的壮观海岸公园',
        detailedDescription: '基奈峡湾国家公园保护着阿拉斯加基奈半岛上669,984英亩的海岸荒野,哈丁冰原为近40条流入大海的冰川提供水源。公园以这些冰川数千年来雕刻的众多峡湾而得名。出口冰川是公园最易到达的冰川,为游客提供了罕见的机会,可以走到冰川前端,见证气候变化的戏剧性影响,因为它继续后退。通过峡湾的船游提供潮水冰川将巨大的冰块掉入海洋的壮观景色,同时也提供在自然栖息地观看虎鲸、座头鲸、海獭、海鹦和海狮的机会。公园的海岸环境支持丰富多样的海洋和陆地野生动物。哈丁冰原是美国仅存的四个冰原之一,覆盖约700平方英里的面积,可通过具有挑战性的8.2英里往返徒步到达,为游客提供这片广阔冰原的令人叹为观止的景色。',
        historicalInfo: '基奈峡湾国家公园于1980年作为阿拉斯加国家利益土地保护法的一部分成立。公园的景观数千年来一直由冰川活动塑造,哈丁冰原是最后一个冰河时代的遗迹。',
        yearBuilt: '1980年',
        architect: '美国国家公园管理局'
      }
    }
  },
  {
    id: 'northern_lights_point',
    cityId: 'anchorage',
    name: 'Northern Lights Viewing Area',
    lat: 64.837778,
    lng: -147.716389,
    radius: 60,
    narration: 'Experience the magical Aurora Borealis at one of Anchorage\'s premier viewing locations. Witness the dancing lights painting the Arctic sky in brilliant greens, purples, and reds.',
    description: 'Prime location for witnessing the spectacular Northern Lights',
    category: 'Natural Wonder',
    detailedDescription: 'Point Woronzof offers one of the best Northern Lights viewing experiences near Anchorage, providing an unobstructed view of the northern sky from a 120-foot bluff overlooking Knik Arm. This location is particularly favored by aurora hunters due to its minimal light pollution and wide-open vistas. The Aurora Borealis, or Northern Lights, occurs when charged particles from the sun interact with Earth\'s magnetic field, creating luminous displays that dance across the night sky in shimmering curtains of green, purple, pink, and red. The best viewing season runs from late August through April, with peak activity typically occurring between 10 PM and 2 AM on clear, dark nights. Anchorage\'s location just below the auroral oval makes it an excellent spot for catching this celestial phenomenon. While displays are never guaranteed, checking aurora forecasts and choosing nights with clear skies and high geomagnetic activity significantly increases your chances. Bundle up warmly, as winter temperatures can drop well below freezing, and bring a camera with manual settings to capture this unforgettable natural light show.',
    photos: [
      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
      'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
      'https://images.unsplash.com/photo-1496714534174-7c9c5e7e8cd7?w=800'
    ],
    historicalInfo: 'The Aurora Borealis has been observed and revered by indigenous peoples of the Arctic for millennia. Point Woronzof was named after Ivan Woronzof, a Russian-American Company administrator in the early 1800s. The viewing area has become increasingly popular for aurora photography since the 1990s.',
    yearBuilt: 'Natural phenomenon observed for millennia',
    architect: 'Natural Formation',
    translations: {
      en: {
        name: 'Northern Lights Viewing Area',
        narration: 'Experience the magical Aurora Borealis at one of Anchorage\'s premier viewing locations. Witness the dancing lights painting the Arctic sky in brilliant greens, purples, and reds.',
        description: 'Prime location for witnessing the spectacular Northern Lights',
        detailedDescription: 'Point Woronzof offers one of the best Northern Lights viewing experiences near Anchorage, providing an unobstructed view of the northern sky from a 120-foot bluff overlooking Knik Arm. This location is particularly favored by aurora hunters due to its minimal light pollution and wide-open vistas. The Aurora Borealis, or Northern Lights, occurs when charged particles from the sun interact with Earth\'s magnetic field, creating luminous displays that dance across the night sky in shimmering curtains of green, purple, pink, and red. The best viewing season runs from late August through April, with peak activity typically occurring between 10 PM and 2 AM on clear, dark nights. Anchorage\'s location just below the auroral oval makes it an excellent spot for catching this celestial phenomenon. While displays are never guaranteed, checking aurora forecasts and choosing nights with clear skies and high geomagnetic activity significantly increases your chances. Bundle up warmly, as winter temperatures can drop well below freezing, and bring a camera with manual settings to capture this unforgettable natural light show.',
        historicalInfo: 'The Aurora Borealis has been observed and revered by indigenous peoples of the Arctic for millennia. Point Woronzof was named after Ivan Woronzof, a Russian-American Company administrator in the early 1800s. The viewing area has become increasingly popular for aurora photography since the 1990s.',
        yearBuilt: 'Natural phenomenon observed for millennia',
        architect: 'Natural Formation'
      },
      ko: {
        name: '오로라 관측 지역',
        narration: '앵커리지 최고의 관측 장소 중 한 곳에서 마법 같은 오로라를 경험하세요. 찬란한 녹색, 보라색, 빨간색으로 북극 하늘을 물들이는 춤추는 빛을 목격하세요.',
        description: '장관을 이루는 오로라를 목격하기 위한 최적의 장소',
        detailedDescription: '포인트 워론조프는 앵커리지 근처에서 최고의 오로라 관측 경험을 제공하며, 니크 암을 내려다보는 120피트 절벽에서 북쪽 하늘의 막힘없는 전망을 제공합니다. 이 장소는 최소한의 광공해와 넓게 트인 전망 때문에 오로라 사냥꾼들이 특히 선호합니다. 오로라 또는 북극광은 태양에서 온 하전 입자가 지구의 자기장과 상호 작용할 때 발생하며, 녹색, 보라색, 분홍색, 빨간색의 반짝이는 커튼으로 밤하늘을 가로질러 춤추는 빛나는 디스플레이를 만듭니다. 최적의 관측 시즌은 8월 말부터 4월까지이며, 맑고 어두운 밤에 오후 10시부터 오전 2시 사이에 일반적으로 최고 활동이 발생합니다. 앵커리지의 오로라 타원 바로 아래 위치는 이 천체 현상을 포착하기에 훌륭한 장소입니다. 디스플레이가 보장되지는 않지만 오로라 예보를 확인하고 맑은 하늘과 높은 지자기 활동이 있는 밤을 선택하면 기회가 크게 증가합니다. 겨울 온도는 영하로 훨씬 떨어질 수 있으므로 따뜻하게 옷을 입고 이 잊을 수 없는 자연 광쇼를 촬영하기 위해 수동 설정이 있는 카메라를 가져오세요.',
        historicalInfo: '오로라는 수천 년 동안 북극의 원주민들에 의해 관찰되고 존경받아 왔습니다. 포인트 워론조프는 1800년대 초 러시아-미국 회사 관리자였던 이반 워론조프의 이름을 따서 명명되었습니다. 관측 지역은 1990년대부터 오로라 사진 촬영으로 점점 더 인기를 얻고 있습니다.',
        yearBuilt: '수천 년 동안 관찰된 자연 현상',
        architect: '자연 형성물'
      },
      ja: {
        name: 'オーロラ観測エリア',
        narration: 'アンカレッジの主要な観測場所の一つで魔法のようなオーロラを体験してください。鮮やかな緑、紫、赤で北極の空を彩る踊る光を目撃してください。',
        description: '壮観なオーロラを目撃するための最適な場所',
        detailedDescription: 'ポイントウォロンゾフは、アンカレッジ近くで最高のオーロラ観測体験を提供し、ニックアームを見下ろす120フィートの崖から北の空の遮るもののない景色を提供します。この場所は、最小限の光害と広々とした展望のため、オーロラハンターに特に好まれています。オーロラまたは北極光は、太陽からの荷電粒子が地球の磁場と相互作用するときに発生し、緑、紫、ピンク、赤のきらめくカーテンで夜空を横切って踊る光る表示を作り出します。最適な観測シーズンは8月下旬から4月まで続き、晴れた暗い夜の午後10時から午前2時の間にピーク活動が通常発生します。アンカレッジのオーロラオーバルのすぐ下の位置は、この天体現象を捉えるのに優れたスポットです。表示が保証されることはありませんが、オーロラ予報を確認し、晴れた空と高い地磁気活動がある夜を選ぶことで、チャンスが大幅に増加します。冬の気温は氷点下をはるかに下回ることがあるので、暖かく着込み、この忘れられない自然の光のショーを撮影するために手動設定のカメラを持参してください。',
        historicalInfo: 'オーロラは何千年もの間、北極の先住民族によって観察され崇拝されてきました。ポイントウォロンゾフは、1800年代初頭のロシア・アメリカ会社の管理者であったイワン・ウォロンゾフにちなんで名付けられました。観測エリアは1990年代以降、オーロラ写真撮影でますます人気が高まっています。',
        yearBuilt: '何千年も観察されてきた自然現象',
        architect: '自然形成物'
      },
      zh: {
        name: '北极光观测区',
        narration: '在安克雷奇最佳观测地点之一体验神奇的极光。见证用璀璨的绿色、紫色和红色描绘北极天空的舞动之光。',
        description: '观赏壮观北极光的最佳位置',
        detailedDescription: '沃龙佐夫角提供安克雷奇附近最佳的北极光观赏体验,从俯瞰尼克湾的120英尺悬崖提供北部天空的无遮挡视野。由于其最小的光污染和开阔的视野,这个位置特别受极光猎人青睐。极光或北极光发生在太阳的带电粒子与地球磁场相互作用时,创造出在夜空中舞动的绿色、紫色、粉色和红色闪烁幕帘的发光显示。最佳观赏季节从8月下旬持续到4月,在晴朗的黑暗夜晚,通常在晚上10点到凌晨2点之间出现高峰活动。安克雷奇位于极光椭圆正下方的位置使其成为捕捉这一天体现象的绝佳地点。虽然永远无法保证显示,但检查极光预报并选择晴朗天空和高地磁活动的夜晚可以显著增加您的机会。由于冬季温度可能降至冰点以下,请穿得暖和,并带上具有手动设置的相机来捕捉这一难忘的自然光秀。',
        historicalInfo: '极光数千年来一直被北极原住民观察和崇敬。沃龙佐夫角以19世纪初俄美公司管理员伊万·沃龙佐夫的名字命名。自1990年代以来,观测区因极光摄影而越来越受欢迎。',
        yearBuilt: '数千年来观察到的自然现象',
        architect: '自然形成'
      }
    }
  },
  {
    id: 'glacier_bay',
    cityId: 'anchorage',
    name: 'Glacier Bay National Park',
    lat: 58.665806,
    lng: -136.900208,
    radius: 80,
    narration: 'Explore Glacier Bay National Park, a UNESCO World Heritage Site showcasing the dynamic process of glacial retreat and a sanctuary for diverse marine wildlife.',
    description: 'UNESCO World Heritage Site with stunning glaciers and abundant wildlife',
    category: 'National Park',
    detailedDescription: 'Glacier Bay National Park and Preserve encompasses 3.3 million acres of dramatic landscapes in Southeast Alaska, where massive tidewater glaciers meet the sea in thunderous displays of calving ice. Designated a UNESCO World Heritage Site in 1979, the park provides a living laboratory for studying glacial retreat and ecological succession. Just 200 years ago, the area was completely covered by a massive glacier; today, the ice has retreated over 65 miles, revealing a pristine wilderness being colonized by pioneering plants and wildlife. The park is accessible primarily by boat or plane, with no roads connecting it to the outside world, preserving its wilderness character. Visitors can witness up to 16 tidewater glaciers, including the spectacular Margerie Glacier and Grand Pacific Glacier. The nutrient-rich waters attract humpback whales that come to feed each summer, while orcas, sea otters, harbor seals, and Steller sea lions populate the fjords. Brown and black bears roam the forested shores, and mountain goats navigate the steep terrain. The park\'s headquarters at Bartlett Cove features a visitor center, lodge, and camping facilities. Glacier Bay represents one of the best places on Earth to witness the rapid changes occurring in glacial environments.',
    photos: [
      'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
      'https://images.unsplash.com/photo-1496714534174-7c9c5e7e8cd7?w=800'
    ],
    historicalInfo: 'Glacier Bay was first documented by European explorers in 1794 when Captain George Vancouver found a wall of ice 20 miles wide and 4,000 feet thick. The bay has since retreated over 65 miles. It was designated a National Monument in 1925 and became a National Park in 1980.',
    yearBuilt: '1980 (National Park designation)',
    architect: 'U.S. National Park Service',
    translations: {
      en: {
        name: 'Glacier Bay National Park',
        narration: 'Explore Glacier Bay National Park, a UNESCO World Heritage Site showcasing the dynamic process of glacial retreat and a sanctuary for diverse marine wildlife.',
        description: 'UNESCO World Heritage Site with stunning glaciers and abundant wildlife',
        detailedDescription: 'Glacier Bay National Park and Preserve encompasses 3.3 million acres of dramatic landscapes in Southeast Alaska, where massive tidewater glaciers meet the sea in thunderous displays of calving ice. Designated a UNESCO World Heritage Site in 1979, the park provides a living laboratory for studying glacial retreat and ecological succession. Just 200 years ago, the area was completely covered by a massive glacier; today, the ice has retreated over 65 miles, revealing a pristine wilderness being colonized by pioneering plants and wildlife. The park is accessible primarily by boat or plane, with no roads connecting it to the outside world, preserving its wilderness character. Visitors can witness up to 16 tidewater glaciers, including the spectacular Margerie Glacier and Grand Pacific Glacier. The nutrient-rich waters attract humpback whales that come to feed each summer, while orcas, sea otters, harbor seals, and Steller sea lions populate the fjords. Brown and black bears roam the forested shores, and mountain goats navigate the steep terrain. The park\'s headquarters at Bartlett Cove features a visitor center, lodge, and camping facilities. Glacier Bay represents one of the best places on Earth to witness the rapid changes occurring in glacial environments.',
        historicalInfo: 'Glacier Bay was first documented by European explorers in 1794 when Captain George Vancouver found a wall of ice 20 miles wide and 4,000 feet thick. The bay has since retreated over 65 miles. It was designated a National Monument in 1925 and became a National Park in 1980.',
        yearBuilt: '1980 (National Park designation)',
        architect: 'U.S. National Park Service'
      },
      ko: {
        name: '글레이셔 베이 국립공원',
        narration: '빙하 후퇴의 역동적인 과정을 보여주고 다양한 해양 야생동물의 보호구역인 유네스코 세계문화유산인 글레이셔 베이 국립공원을 탐험하세요.',
        description: '놀라운 빙하와 풍부한 야생동물이 있는 유네스코 세계문화유산',
        detailedDescription: '글레이셔 베이 국립공원은 동남 알래스카에서 330만 에이커의 극적인 풍경을 아우르며, 거대한 조수 빙하가 바다와 만나 얼음이 떨어지는 천둥 같은 광경을 연출합니다. 1979년에 유네스코 세계문화유산으로 지정된 이 공원은 빙하 후퇴와 생태 천이를 연구하기 위한 살아있는 실험실을 제공합니다. 불과 200년 전, 이 지역은 거대한 빙하로 완전히 덮여 있었습니다. 오늘날 얼음은 65마일 이상 후퇴하여 개척 식물과 야생동물이 정착하는 원시 야생지대를 드러냈습니다. 공원은 주로 보트나 비행기로 접근할 수 있으며, 외부 세계와 연결하는 도로가 없어 야생 특성을 보존합니다. 방문객들은 장관을 이루는 마저리 빙하와 그랜드 퍼시픽 빙하를 포함하여 최대 16개의 조수 빙하를 목격할 수 있습니다. 영양이 풍부한 물은 매년 여름 먹이를 먹으러 오는 혹등고래를 끌어들이며, 범고래, 해달, 항만 물범, 스텔러 바다사자가 피오르드를 채웁니다. 갈색곰과 흑곰은 숲이 우거진 해안을 돌아다니고, 산양은 가파른 지형을 탐색합니다. 바틀렛 코브의 공원 본부에는 방문자 센터, 롯지 및 캠핑 시설이 있습니다. 글레이셔 베이는 빙하 환경에서 발생하는 급격한 변화를 목격할 수 있는 지구상 최고의 장소 중 하나를 나타냅니다.',
        historicalInfo: '글레이셔 베이는 1794년 조지 밴쿠버 선장이 너비 20마일, 두께 4,000피트의 얼음 벽을 발견했을 때 유럽 탐험가들에 의해 처음 문서화되었습니다. 베이는 이후 65마일 이상 후퇴했습니다. 1925년에 국립기념물로 지정되었으며 1980년에 국립공원이 되었습니다.',
        yearBuilt: '1980년 (국립공원 지정)',
        architect: '미국 국립공원 관리청'
      },
      ja: {
        name: 'グレーシャーベイ国立公園',
        narration: '氷河の後退の動的なプロセスを示し、多様な海洋野生生物の保護区であるユネスコ世界遺産、グレーシャーベイ国立公園を探索してください。',
        description: '見事な氷河と豊富な野生生物を持つユネスコ世界遺産',
        detailedDescription: 'グレーシャーベイ国立公園は、南東アラスカで330万エーカーの劇的な景観を包含し、巨大な潮水氷河が海と出会い、氷が崩れ落ちる雷のような光景を演出します。1979年にユネスコ世界遺産に指定されたこの公園は、氷河の後退と生態系の遷移を研究するための生きた実験室を提供しています。わずか200年前、この地域は巨大な氷河で完全に覆われていました。今日、氷は65マイル以上後退し、先駆的な植物や野生生物が定着している原始的な荒野を明らかにしました。公園は主にボートまたは飛行機でアクセス可能で、外部世界とつながる道路がなく、その荒野の特性を保存しています。訪問者は、壮観なマージェリー氷河とグランドパシフィック氷河を含む最大16の潮水氷河を目撃できます。栄養豊富な水は毎年夏に餌を食べに来るザトウクジラを引き付け、シャチ、ラッコ、ゴマフアザラシ、ステラーアシカがフィヨルドに生息しています。ヒグマとツキノワグマは森林に覆われた海岸を歩き回り、マウンテンゴートは険しい地形を移動します。バートレットコーブの公園本部には、ビジターセンター、ロッジ、キャンプ施設があります。グレーシャーベイは、氷河環境で発生している急速な変化を目撃できる地球上で最高の場所の一つを表しています。',
        historicalInfo: 'グレーシャーベイは1794年にジョージ・バンクーバー船長が幅20マイル、厚さ4,000フィートの氷の壁を発見したときにヨーロッパの探検家によって最初に文書化されました。湾はその後65マイル以上後退しました。1925年に国定記念物に指定され、1980年に国立公園になりました。',
        yearBuilt: '1980年 (国立公園指定)',
        architect: '米国国立公園局'
      },
      zh: {
        name: '冰川湾国家公园',
        narration: '探索冰川湾国家公园,这是一个联合国教科文组织世界遗产,展示了冰川退缩的动态过程和多样化海洋野生动物的保护区。',
        description: '拥有壮观冰川和丰富野生动物的联合国教科文组织世界遗产',
        detailedDescription: '冰川湾国家公园占地330万英亩,位于阿拉斯加东南部,巨大的潮水冰川与大海相遇,呈现出雷鸣般的崩解冰景象。1979年被指定为联合国教科文组织世界遗产,该公园为研究冰川退缩和生态演替提供了一个活的实验室。仅仅200年前,该地区完全被巨大的冰川覆盖;今天,冰川已退缩超过65英里,揭示了正在被先锋植物和野生动物定居的原始荒野。公园主要通过船只或飞机到达,没有道路连接外部世界,保持了其荒野特性。游客可以目睹多达16个潮水冰川,包括壮观的玛杰丽冰川和大太平洋冰川。营养丰富的水域吸引每年夏天前来觅食的座头鲸,而虎鲸、海獭、港海豹和斯特勒海狮则栖息在峡湾中。棕熊和黑熊在森林覆盖的海岸漫游,山羊在陡峭的地形中穿行。巴特利特湾的公园总部设有游客中心、旅馆和露营设施。冰川湾代表了地球上目睹冰川环境快速变化的最佳地点之一。',
        historicalInfo: '冰川湾于1794年首次由欧洲探险家记录,当时乔治·温哥华船长发现了一堵宽20英里、厚4,000英尺的冰墙。海湾此后退缩了65英里以上。它于1925年被指定为国家纪念碑,并于1980年成为国家公园。',
        yearBuilt: '1980年 (国家公园指定)',
        architect: '美国国家公园管理局'
      }
    }
  },
  // Amsterdam landmarks
  {
    id: 'anne_frank_house',
    cityId: 'amsterdam',
    name: 'Anne Frank House',
    lat: 52.375218,
    lng: 4.883977,
    radius: 50,
    narration: 'Welcome to the Anne Frank House, where Anne Frank and her family hid during World War II. This historic house museum preserves the memory of one of the most famous victims of the Holocaust.',
    description: 'Historic house museum and hiding place of Anne Frank',
    category: 'Historical Site',
    detailedDescription: 'The Anne Frank House is a historic house and biographical museum dedicated to Jewish wartime diarist Anne Frank. The building is located on a canal called the Prinsengracht, close to the Westerkerk, in central Amsterdam. During World War II, Anne Frank hid from Nazi persecution with her family and four other people in hidden rooms at the rear of the building. Anne Frank did not survive the war but her diary became one of the world\'s most read books. The museum opened in 1960 and preserves the hiding place, has a permanent exhibition on the life and times of Anne Frank, and has an exhibition space about all forms of persecution and discrimination.',
    photos: [
      'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800',
      'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800',
      'https://images.unsplash.com/photo-1576924542622-772281b13aa8?w=800'
    ],
    historicalInfo: 'Anne Frank and her family hid in this house from 1942 to 1944 before being discovered and deported to concentration camps. After the war, Otto Frank, Anne\'s father and the only family member to survive, published her diary. The house was saved from demolition and opened as a museum in 1960.',
    yearBuilt: '1635 (house built), 1960 (museum opened)',
    architect: 'Otto Frank (museum founder)',
    translations: {
      en: {
        name: 'Anne Frank House',
        narration: 'Welcome to the Anne Frank House, where Anne Frank and her family hid during World War II. This historic house museum preserves the memory of one of the most famous victims of the Holocaust.',
        description: 'Historic house museum and hiding place of Anne Frank',
        detailedDescription: 'The Anne Frank House is a historic house and biographical museum dedicated to Jewish wartime diarist Anne Frank. The building is located on a canal called the Prinsengracht, close to the Westerkerk, in central Amsterdam. During World War II, Anne Frank hid from Nazi persecution with her family and four other people in hidden rooms at the rear of the building. Anne Frank did not survive the war but her diary became one of the world\'s most read books. The museum opened in 1960 and preserves the hiding place, has a permanent exhibition on the life and times of Anne Frank, and has an exhibition space about all forms of persecution and discrimination.',
        historicalInfo: 'Anne Frank and her family hid in this house from 1942 to 1944 before being discovered and deported to concentration camps. After the war, Otto Frank, Anne\'s father and the only family member to survive, published her diary. The house was saved from demolition and opened as a museum in 1960.',
        yearBuilt: '1635 (house built), 1960 (museum opened)',
        architect: 'Otto Frank (museum founder)'
      },
      ko: {
        name: '안네 프랑크의 집',
        narration: '제2차 세계대전 동안 안네 프랑크와 그녀의 가족이 숨어 지낸 안네 프랑크의 집에 오신 것을 환영합니다. 이 역사적인 주택 박물관은 홀로코스트의 가장 유명한 희생자 중 한 명의 기억을 보존합니다.',
        description: '안네 프랑크의 역사적인 은신처이자 박물관',
        detailedDescription: '안네 프랑크의 집은 유대인 전시 일기 작가 안네 프랑크를 기리는 역사적인 집이자 전기 박물관입니다. 건물은 암스테르담 중심부의 베스테르케르크 근처 프린센그라흐트라는 운하에 위치해 있습니다. 제2차 세계대전 동안 안네 프랑크는 나치 박해를 피해 가족과 네 명의 다른 사람들과 함께 건물 뒤편의 숨겨진 방에 숨어 지냈습니다. 안네 프랑크는 전쟁에서 살아남지 못했지만 그녀의 일기는 세계에서 가장 많이 읽힌 책 중 하나가 되었습니다. 박물관은 1960년에 개관했으며 은신처를 보존하고 안네 프랑크의 생애와 시대에 대한 상설 전시회와 모든 형태의 박해와 차별에 대한 전시 공간을 갖추고 있습니다.',
        historicalInfo: '안네 프랑크와 그녀의 가족은 1942년부터 1944년까지 이 집에 숨어 지냈으며, 발견되어 강제 수용소로 이송되었습니다. 전쟁 후 유일하게 살아남은 가족 구성원인 안네의 아버지 오토 프랑크가 그녀의 일기를 출판했습니다. 이 집은 철거를 면하고 1960년에 박물관으로 개관했습니다.',
        yearBuilt: '1635년 (주택 건축), 1960년 (박물관 개관)',
        architect: '오토 프랑크 (박물관 설립자)'
      },
      ja: {
        name: 'アンネ・フランクの家',
        narration: '第二次世界大戦中にアンネ・フランクとその家族が隠れていたアンネ・フランクの家へようこそ。この歴史的な家屋博物館は、ホロコーストの最も有名な犠牲者の一人の記憶を保存しています。',
        description: 'アンネ・フランクの歴史的な隠れ家であり博物館',
        detailedDescription: 'アンネ・フランクの家は、ユダヤ人戦時日記作家アンネ・フランクに捧げられた歴史的な家屋および伝記博物館です。建物はアムステルダム中心部のウェステルケルク近くのプリンセングラハトという運河に位置しています。第二次世界大戦中、アンネ・フランクは家族と4人の他の人々とともにナチスの迫害を逃れて建物の裏側の隠し部屋に隠れていました。アンネ・フランクは戦争を生き延びることはできませんでしたが、彼女の日記は世界で最も読まれた本の一つになりました。博物館は1960年に開館し、隠れ家を保存し、アンネ・フランクの生涯と時代に関する常設展示、およびあらゆる形態の迫害と差別に関する展示スペースを備えています。',
        historicalInfo: 'アンネ・フランクとその家族は1942年から1944年までこの家に隠れていましたが、発見されて強制収容所に送られました。戦後、唯一の生存家族であるアンネの父オットー・フランクが彼女の日記を出版しました。この家は取り壊しを免れ、1960年に博物館として開館しました。',
        yearBuilt: '1635年 (家屋建築), 1960年 (博物館開館)',
        architect: 'オットー・フランク (博物館創設者)'
      },
      zh: {
        name: '安妮·弗兰克之家',
        narration: '欢迎来到安妮·弗兰克之家,这里是安妮·弗兰克和她的家人在第二次世界大战期间的藏身之处。这座历史悠久的房屋博物馆保存着大屠杀最著名受害者之一的记忆。',
        description: '安妮·弗兰克的历史藏身处和博物馆',
        detailedDescription: '安妮·弗兰克之家是一座历史悠久的房屋和传记博物馆,致力于纪念犹太战时日记作家安妮·弗兰克。该建筑位于阿姆斯特丹市中心西教堂附近的王子运河上。第二次世界大战期间,安妮·弗兰克与家人和其他四人躲在建筑后部的隐蔽房间中,以逃避纳粹迫害。安妮·弗兰克没有在战争中幸存,但她的日记成为世界上阅读最多的书籍之一。博物馆于1960年开放,保存了藏身处,设有关于安妮·弗兰克生平和时代的常设展览,以及关于各种形式迫害和歧视的展览空间。',
        historicalInfo: '安妮·弗兰克和她的家人从1942年到1944年躲藏在这所房子里,后来被发现并被驱逐到集中营。战后,安妮的父亲奥托·弗兰克作为唯一幸存的家庭成员出版了她的日记。这所房子免于拆除,并于1960年作为博物馆开放。',
        yearBuilt: '1635年 (房屋建造), 1960年 (博物馆开放)',
        architect: '奥托·弗兰克 (博物馆创始人)'
      }
    }
  },
  {
    id: 'rijksmuseum',
    cityId: 'amsterdam',
    name: 'Rijksmuseum',
    lat: 52.359998,
    lng: 4.885218,
    radius: 80,
    narration: 'Welcome to the Rijksmuseum, the Netherlands\' national museum dedicated to arts and history. Home to masterpieces by Rembrandt, Vermeer, and countless other Dutch masters.',
    description: 'National museum of the Netherlands with Dutch Golden Age masterpieces',
    category: 'Art Museum',
    detailedDescription: 'The Rijksmuseum is a Dutch national museum dedicated to arts and history in Amsterdam. The museum is located at the Museum Square in the borough Amsterdam South, close to the Van Gogh Museum and the Stedelijk Museum. The Rijksmuseum was founded in The Hague in 1800 and moved to Amsterdam in 1808. The current main building was designed by Pierre Cuypers and first opened in 1885. The museum has on display 8,000 objects of art and history, from their total collection of 1 million objects from the years 1200–2000, among which are some masterpieces by Rembrandt, Frans Hals, and Johannes Vermeer. The museum also has a small Asian collection which is on display in the Asian pavilion.',
    photos: [
      'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800',
      'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800',
      'https://images.unsplash.com/photo-1576924542622-772281b13aa8?w=800'
    ],
    historicalInfo: 'The Rijksmuseum was founded in The Hague in 1800 and moved to Amsterdam in 1808, where it was first located in the Royal Palace and later in the Trippenhuis. The current main building was designed by Pierre Cuypers and first opened its doors in 1885. On 13 April 2013, after a ten-year renovation, the main building was reopened by Queen Beatrix.',
    yearBuilt: '1800 (founded), 1885 (current building opened)',
    architect: 'Pierre Cuypers',
    translations: {
      en: {
        name: 'Rijksmuseum',
        narration: 'Welcome to the Rijksmuseum, the Netherlands\' national museum dedicated to arts and history. Home to masterpieces by Rembrandt, Vermeer, and countless other Dutch masters.',
        description: 'National museum of the Netherlands with Dutch Golden Age masterpieces',
        detailedDescription: 'The Rijksmuseum is a Dutch national museum dedicated to arts and history in Amsterdam. The museum is located at the Museum Square in the borough Amsterdam South, close to the Van Gogh Museum and the Stedelijk Museum. The Rijksmuseum was founded in The Hague in 1800 and moved to Amsterdam in 1808. The current main building was designed by Pierre Cuypers and first opened in 1885. The museum has on display 8,000 objects of art and history, from their total collection of 1 million objects from the years 1200–2000, among which are some masterpieces by Rembrandt, Frans Hals, and Johannes Vermeer. The museum also has a small Asian collection which is on display in the Asian pavilion.',
        historicalInfo: 'The Rijksmuseum was founded in The Hague in 1800 and moved to Amsterdam in 1808, where it was first located in the Royal Palace and later in the Trippenhuis. The current main building was designed by Pierre Cuypers and first opened its doors in 1885. On 13 April 2013, after a ten-year renovation, the main building was reopened by Queen Beatrix.',
        yearBuilt: '1800 (founded), 1885 (current building opened)',
        architect: 'Pierre Cuypers'
      },
      ko: {
        name: '라익스뮤지엄',
        narration: '예술과 역사에 전념하는 네덜란드 국립 박물관인 라익스뮤지엄에 오신 것을 환영합니다. 렘브란트, 베르메르 및 수많은 다른 네덜란드 거장들의 걸작이 있는 곳입니다.',
        description: '네덜란드 황금시대 걸작이 있는 네덜란드 국립 박물관',
        detailedDescription: '라익스뮤지엄은 암스테르담의 예술과 역사에 전념하는 네덜란드 국립 박물관입니다. 박물관은 반 고흐 박물관과 스테델릭 박물관 근처 암스테르담 남부 자치구의 뮤지엄 광장에 위치하고 있습니다. 라익스뮤지엄은 1800년 헤이그에 설립되었으며 1808년 암스테르담으로 이전했습니다. 현재 본관은 피에르 카위퍼스가 설계했으며 1885년에 처음 개관했습니다. 박물관은 1200년부터 2000년까지의 총 100만 점의 소장품 중 8,000점의 예술품과 역사적 유물을 전시하고 있으며, 그 중에는 렘브란트, 프란스 할스, 요하네스 베르메르의 걸작들이 포함되어 있습니다. 박물관에는 아시아 파빌리온에 전시된 소규모 아시아 컬렉션도 있습니다.',
        historicalInfo: '라익스뮤지엄은 1800년 헤이그에 설립되었으며 1808년 암스테르담으로 이전했습니다. 처음에는 왕궁에, 나중에는 트리펜하우스에 위치했습니다. 현재 본관은 피에르 카위퍼스가 설계했으며 1885년에 처음 문을 열었습니다. 2013년 4월 13일, 10년간의 보수 공사 후 본관이 베아트릭스 여왕에 의해 재개관했습니다.',
        yearBuilt: '1800년 (설립), 1885년 (현재 건물 개관)',
        architect: '피에르 카위퍼스'
      },
      ja: {
        name: 'ライクスミュージアム',
        narration: 'オランダの芸術と歴史に捧げられた国立博物館、ライクスミュージアムへようこそ。レンブラント、フェルメール、そして数え切れないほどのオランダの巨匠たちの傑作が収蔵されています。',
        description: 'オランダ黄金時代の傑作を所蔵するオランダ国立博物館',
        detailedDescription: 'ライクスミュージアムはアムステルダムにある芸術と歴史に捧げられたオランダ国立博物館です。博物館はゴッホ美術館とステデライク美術館の近く、アムステルダム南区のミュージアム広場に位置しています。ライクスミュージアムは1800年にハーグで設立され、1808年にアムステルダムに移転しました。現在の本館はピエール・カイパースによって設計され、1885年に最初に開館しました。博物館には1200年から2000年までの総コレクション100万点の中から8,000点の芸術品と歴史的遺物が展示されており、その中にはレンブラント、フランス・ハルス、ヨハネス・フェルメールの傑作が含まれています。博物館にはアジアパビリオンに展示されている小規模なアジアコレクションもあります。',
        historicalInfo: 'ライクスミュージアムは1800年にハーグで設立され、1808年にアムステルダムに移転しました。最初は王宮に、その後トリッペンハウスに位置していました。現在の本館はピエール・カイパースによって設計され、1885年に最初に扉を開きました。2013年4月13日、10年間の改修工事の後、本館はベアトリクス女王によって再開されました。',
        yearBuilt: '1800年 (設立), 1885年 (現在の建物開館)',
        architect: 'ピエール・カイパース'
      },
      zh: {
        name: '国家博物馆',
        narration: '欢迎来到荷兰国家博物馆,这是致力于艺术和历史的荷兰国家博物馆。这里收藏了伦勃朗、维米尔和无数其他荷兰大师的杰作。',
        description: '拥有荷兰黄金时代杰作的荷兰国家博物馆',
        detailedDescription: '国家博物馆是位于阿姆斯特丹的荷兰国家艺术和历史博物馆。博物馆位于阿姆斯特丹南区的博物馆广场,靠近梵高博物馆和市立博物馆。国家博物馆于1800年在海牙成立,并于1808年迁至阿姆斯特丹。目前的主建筑由皮埃尔·凯普斯设计,于1885年首次开放。博物馆展出了从1200年至2000年的总收藏100万件物品中的8,000件艺术品和历史文物,其中包括伦勃朗、弗朗斯·哈尔斯和约翰内斯·维米尔的一些杰作。博物馆还有一个在亚洲展馆展出的小型亚洲收藏。',
        historicalInfo: '国家博物馆于1800年在海牙成立,并于1808年迁至阿姆斯特丹,最初位于皇宫,后来位于特里彭豪斯。目前的主建筑由皮埃尔·凯普斯设计,于1885年首次开放。2013年4月13日,经过十年的翻新,主建筑由贝娅特丽克丝女王重新开放。',
        yearBuilt: '1800年 (成立), 1885年 (现建筑开放)',
        architect: '皮埃尔·凯普斯'
      }
    }
  },
  // Barcelona landmarks
  {
    id: 'sagrada_familia',
    cityId: 'barcelona',
    name: 'Sagrada Familia',
    lat: 41.403629,
    lng: 2.174356,
    radius: 80,
    narration: 'Welcome to the Sagrada Familia, Antoni Gaudí\'s masterpiece and Barcelona\'s most iconic landmark. This breathtaking basilica has been under construction for over 140 years.',
    description: 'Gaudí\'s magnificent unfinished basilica, a UNESCO World Heritage Site',
    category: 'Architecture',
    detailedDescription: 'The Basílica de la Sagrada Família, also known as the Sagrada Família, is a large unfinished Roman Catholic minor basilica in Barcelona, Catalonia, Spain. Designed by Catalan architect Antoni Gaudí (1852–1926), his work on the building is part of a UNESCO World Heritage Site. Construction began in 1882 and is projected to be completed in 2026, the centenary of Gaudí\'s death. Combining Gothic and Art Nouveau forms, the Sagrada Família is renowned for its unique architectural style featuring organic shapes inspired by nature. The basilica has three grand facades: the Nativity facade, the Passion facade, and the Glory facade, each telling a different part of the story of Jesus. The interior is equally spectacular, with towering columns designed to resemble trees in a forest, creating a stunning canopy effect.',
    photos: [
      'https://images.unsplash.com/photo-1583779457050-39e95d3d9d8b?w=800',
      'https://images.unsplash.com/photo-1561632669-7f55f7975606?w=800',
      'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800'
    ],
    historicalInfo: 'Construction of the Sagrada Família started in 1882 under architect Francisco de Paula del Villar. In 1883, Antoni Gaudí took over the project and transformed it with his architectural vision. He worked on the church for 43 years until his death in 1926. Gaudí devoted his final years exclusively to the project, and at the time of his death, less than a quarter of the project was complete.',
    yearBuilt: '1882-present (under construction)',
    architect: 'Antoni Gaudí',
    translations: {
      en: {
        name: 'Sagrada Familia',
        narration: 'Welcome to the Sagrada Familia, Antoni Gaudí\'s masterpiece and Barcelona\'s most iconic landmark. This breathtaking basilica has been under construction for over 140 years.',
        description: 'Gaudí\'s magnificent unfinished basilica, a UNESCO World Heritage Site',
        detailedDescription: 'The Basílica de la Sagrada Família, also known as the Sagrada Família, is a large unfinished Roman Catholic minor basilica in Barcelona, Catalonia, Spain. Designed by Catalan architect Antoni Gaudí (1852–1926), his work on the building is part of a UNESCO World Heritage Site. Construction began in 1882 and is projected to be completed in 2026, the centenary of Gaudí\'s death. Combining Gothic and Art Nouveau forms, the Sagrada Família is renowned for its unique architectural style featuring organic shapes inspired by nature. The basilica has three grand facades: the Nativity facade, the Passion facade, and the Glory facade, each telling a different part of the story of Jesus. The interior is equally spectacular, with towering columns designed to resemble trees in a forest, creating a stunning canopy effect.',
        historicalInfo: 'Construction of the Sagrada Família started in 1882 under architect Francisco de Paula del Villar. In 1883, Antoni Gaudí took over the project and transformed it with his architectural vision. He worked on the church for 43 years until his death in 1926. Gaudí devoted his final years exclusively to the project, and at the time of his death, less than a quarter of the project was complete.',
        yearBuilt: '1882-present (under construction)',
        architect: 'Antoni Gaudí'
      },
      ko: {
        name: '사그라다 파밀리아',
        narration: '안토니 가우디의 걸작이자 바르셀로나의 가장 상징적인 랜드마크인 사그라다 파밀리아에 오신 것을 환영합니다. 이 숨막히는 바실리카는 140년 넘게 건설 중입니다.',
        description: '가우디의 장엄한 미완성 바실리카, 유네스코 세계문화유산',
        detailedDescription: '사그라다 파밀리아 대성당은 스페인 카탈루냐 바르셀로나에 있는 대형 미완성 로마 가톨릭 소바실리카입니다. 카탈루냐 건축가 안토니 가우디(1852-1926)가 설계했으며, 그의 작업은 유네스코 세계문화유산의 일부입니다. 건설은 1882년에 시작되었으며 가우디 사망 100주년인 2026년에 완성될 것으로 예상됩니다. 고딕 양식과 아르누보 형식을 결합한 사그라다 파밀리아는 자연에서 영감을 받은 유기적 형태를 특징으로 하는 독특한 건축 양식으로 유명합니다. 바실리카에는 세 개의 웅장한 파사드가 있습니다: 탄생 파사드, 수난 파사드, 영광 파사드로, 각각 예수의 이야기의 다른 부분을 이야기합니다. 내부도 똑같이 장관으로, 숲속의 나무를 닮도록 설계된 우뚝 솟은 기둥이 놀라운 캐노피 효과를 만들어냅니다.',
        historicalInfo: '사그라다 파밀리아 건설은 1882년 건축가 프란시스코 데 파울라 델 비야르의 지휘 하에 시작되었습니다. 1883년, 안토니 가우디가 프로젝트를 인수하고 그의 건축적 비전으로 변모시켰습니다. 그는 1926년 사망할 때까지 43년 동안 교회를 작업했습니다. 가우디는 말년을 오직 이 프로젝트에만 전념했으며, 그의 사망 당시 프로젝트의 1/4도 완성되지 않았습니다.',
        yearBuilt: '1882년-현재 (건설 중)',
        architect: '안토니 가우디'
      },
      ja: {
        name: 'サグラダ・ファミリア',
        narration: 'アントニ・ガウディの傑作であり、バルセロナで最も象徴的なランドマークであるサグラダ・ファミリアへようこそ。この息をのむようなバシリカは140年以上建設中です。',
        description: 'ガウディの壮大な未完成バシリカ、ユネスコ世界遺産',
        detailedDescription: 'サグラダ・ファミリア大聖堂は、スペインのカタルーニャ州バルセロナにある大型の未完成ローマカトリック小バシリカです。カタルーニャの建築家アントニ・ガウディ(1852-1926)によって設計され、建物に関する彼の作業はユネスコ世界遺産の一部です。建設は1882年に始まり、ガウディの死の100周年である2026年に完成すると予測されています。ゴシック様式とアールヌーヴォー様式を組み合わせたサグラダ・ファミリアは、自然に触発された有機的な形状を特徴とする独特の建築様式で有名です。バシリカには3つの壮大なファサードがあります:降誕のファサード、受難のファサード、栄光のファサードで、それぞれがイエスの物語の異なる部分を語っています。内部も同様に壮観で、森の木々に似せて設計された高くそびえる柱が、見事な天蓋効果を生み出しています。',
        historicalInfo: 'サグラダ・ファミリアの建設は、建築家フランシスコ・デ・パウラ・デル・ビリャールの下で1882年に開始されました。1883年、アントニ・ガウディがプロジェクトを引き継ぎ、彼の建築ビジョンで変貌させました。彼は1926年に亡くなるまで43年間教会に取り組みました。ガウディは晩年をこのプロジェクトにのみ専念させ、彼の死の時点で、プロジェクトの4分の1も完成していませんでした。',
        yearBuilt: '1882年-現在 (建設中)',
        architect: 'アントニ・ガウディ'
      },
      zh: {
        name: '圣家堂',
        narration: '欢迎来到圣家堂,安东尼·高迪的杰作和巴塞罗那最具标志性的地标。这座令人叹为观止的大教堂已经建造了140多年。',
        description: '高迪宏伟的未完成大教堂,联合国教科文组织世界遗产',
        detailedDescription: '圣家堂大教堂是位于西班牙加泰罗尼亚巴塞罗那的一座大型未完成罗马天主教次级圣殿。由加泰罗尼亚建筑师安东尼·高迪(1852-1926)设计,他对这座建筑的工作是联合国教科文组织世界遗产的一部分。建设始于1882年,预计将在2026年,即高迪逝世100周年时完工。结合哥特式和新艺术风格,圣家堂以其独特的建筑风格而闻名,其特色是受自然启发的有机形状。大教堂有三个宏伟的立面:诞生立面、受难立面和荣耀立面,每个都讲述了耶稣故事的不同部分。内部同样壮观,设计成森林中树木的高耸柱子,创造出令人惊叹的树冠效果。',
        historicalInfo: '圣家堂的建设于1882年在建筑师弗朗西斯科·德·保拉·德尔·比利亚尔的领导下开始。1883年,安东尼·高迪接管了这个项目,并用他的建筑愿景改造了它。他在1926年去世之前为这座教堂工作了43年。高迪将他的晚年完全奉献给了这个项目,在他去世时,项目还不到四分之一完成。',
        yearBuilt: '1882年-至今 (建设中)',
        architect: '安东尼·高迪'
      }
    }
  },
  {
    id: 'park_guell',
    cityId: 'barcelona',
    name: 'Park Güell',
    lat: 41.414495,
    lng: 2.152694,
    radius: 100,
    narration: 'Welcome to Park Güell, Antoni Gaudí\'s whimsical park filled with colorful mosaics and organic architecture. This UNESCO World Heritage Site offers stunning views of Barcelona.',
    description: 'Gaudí\'s colorful mosaic park with panoramic city views',
    category: 'Park',
    detailedDescription: 'Park Güell is a public park system composed of gardens and architectural elements located on Carmel Hill in Barcelona, Catalonia, Spain. Designed by Antoni Gaudí and built between 1900 and 1914, the park was originally developed as a housing site by Eusebi Güell. It was officially opened as a public park in 1926. The park showcases Gaudí\'s unique architectural and artistic style with colorful ceramic mosaics, undulating forms, and organic shapes inspired by nature. The famous serpentine bench covered in trencadís (broken ceramic tiles) offers panoramic views of Barcelona and the Mediterranean Sea. The park includes the famous dragon/lizard sculpture known as "El Drac" covered in colorful mosaic, which has become a symbol of Barcelona.',
    photos: [
      'https://images.unsplash.com/photo-1583779457050-39e95d3d9d8b?w=800',
      'https://images.unsplash.com/photo-1561632669-7f55f7975606?w=800',
      'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800'
    ],
    historicalInfo: 'Park Güell was designed by Antoni Gaudí for Eusebi Güell as a garden city project between 1900 and 1914. The project was inspired by the English garden city movement. Only two houses were built, one of which was Gaudí\'s home from 1906 to 1925, now the Gaudí House Museum. In 1984, UNESCO designated Park Güell as a World Heritage Site.',
    yearBuilt: '1900-1914',
    architect: 'Antoni Gaudí',
    translations: {
      en: {
        name: 'Park Güell',
        narration: 'Welcome to Park Güell, Antoni Gaudí\'s whimsical park filled with colorful mosaics and organic architecture. This UNESCO World Heritage Site offers stunning views of Barcelona.',
        description: 'Gaudí\'s colorful mosaic park with panoramic city views',
        detailedDescription: 'Park Güell is a public park system composed of gardens and architectural elements located on Carmel Hill in Barcelona, Catalonia, Spain. Designed by Antoni Gaudí and built between 1900 and 1914, the park was originally developed as a housing site by Eusebi Güell. It was officially opened as a public park in 1926. The park showcases Gaudí\'s unique architectural and artistic style with colorful ceramic mosaics, undulating forms, and organic shapes inspired by nature. The famous serpentine bench covered in trencadís (broken ceramic tiles) offers panoramic views of Barcelona and the Mediterranean Sea. The park includes the famous dragon/lizard sculpture known as "El Drac" covered in colorful mosaic, which has become a symbol of Barcelona.',
        historicalInfo: 'Park Güell was designed by Antoni Gaudí for Eusebi Güell as a garden city project between 1900 and 1914. The project was inspired by the English garden city movement. Only two houses were built, one of which was Gaudí\'s home from 1906 to 1925, now the Gaudí House Museum. In 1984, UNESCO designated Park Güell as a World Heritage Site.',
        yearBuilt: '1900-1914',
        architect: 'Antoni Gaudí'
      },
      ko: {
        name: '구엘 공원',
        narration: '화려한 모자이크와 유기적 건축물로 가득한 안토니 가우디의 기발한 공원인 구엘 공원에 오신 것을 환영합니다. 이 유네스코 세계문화유산은 바르셀로나의 멋진 전망을 제공합니다.',
        description: '파노라마 도시 전망을 갖춘 가우디의 화려한 모자이크 공원',
        detailedDescription: '구엘 공원은 스페인 카탈루냐 바르셀로나의 카르멜 언덕에 위치한 정원과 건축 요소로 구성된 공공 공원 시스템입니다. 안토니 가우디가 설계하고 1900년에서 1914년 사이에 건설된 이 공원은 원래 에우제비 구엘에 의해 주거지로 개발되었습니다. 1926년에 공식적으로 공공 공원으로 개장했습니다. 공원은 자연에서 영감을 받은 화려한 세라믹 모자이크, 물결 모양 형태 및 유기적 형태로 가우디의 독특한 건축 및 예술적 스타일을 선보입니다. 트렌카디스(깨진 세라믹 타일)로 덮인 유명한 뱀 모양 벤치는 바르셀로나와 지중해의 파노라마 전망을 제공합니다. 공원에는 바르셀로나의 상징이 된 화려한 모자이크로 덮인 "엘 드락"으로 알려진 유명한 용/도마뱀 조각상이 있습니다.',
        historicalInfo: '구엘 공원은 1900년에서 1914년 사이에 에우제비 구엘을 위한 정원 도시 프로젝트로 안토니 가우디가 설계했습니다. 이 프로젝트는 영국 정원 도시 운동에서 영감을 받았습니다. 단 두 채의 주택만 지어졌으며, 그 중 하나는 1906년부터 1925년까지 가우디의 집으로, 현재 가우디 하우스 박물관입니다. 1984년, 유네스코는 구엘 공원을 세계문화유산으로 지정했습니다.',
        yearBuilt: '1900-1914년',
        architect: '안토니 가우디'
      },
      ja: {
        name: 'グエル公園',
        narration: 'アントニ・ガウディの色彩豊かなモザイクと有機的な建築で満たされた風変わりな公園、グエル公園へようこそ。このユネスコ世界遺産はバルセロナの素晴らしい景色を提供します。',
        description: 'パノラマの都市景観を持つガウディのカラフルなモザイク公園',
        detailedDescription: 'グエル公園は、スペインのカタルーニャ州バルセロナのカルメル丘に位置する庭園と建築要素で構成される公共公園システムです。アントニ・ガウディによって設計され、1900年から1914年の間に建設されました。公園は元々エウセビ・グエルによって住宅地として開発されました。1926年に公式に公共公園として開園しました。公園は、自然に触発されたカラフルなセラミックモザイク、うねる形、有機的な形でガウディ独特の建築的・芸術的スタイルを披露しています。トレンカディス(割れたセラミックタイル)で覆われた有名な蛇行するベンチは、バルセロナと地中海のパノラマビューを提供します。公園には、バルセロナのシンボルとなったカラフルなモザイクで覆われた「エル・ドラック」として知られる有名なドラゴン/トカゲの彫刻があります。',
        historicalInfo: 'グエル公園は、1900年から1914年の間にエウセビ・グエルのための庭園都市プロジェクトとしてアントニ・ガウディによって設計されました。このプロジェクトはイギリスの田園都市運動に触発されました。わずか2軒の家が建てられ、そのうちの1軒は1906年から1925年までガウディの家で、現在はガウディハウス博物館です。1984年、ユネスコはグエル公園を世界遺産に指定しました。',
        yearBuilt: '1900-1914年',
        architect: 'アントニ・ガウディ'
      },
      zh: {
        name: '奎尔公园',
        narration: '欢迎来到奎尔公园,安东尼·高迪充满色彩马赛克和有机建筑的奇思妙想公园。这个联合国教科文组织世界遗产提供巴塞罗那的壮丽景色。',
        description: '高迪的彩色马赛克公园,拥有全景城市景观',
        detailedDescription: '奎尔公园是位于西班牙加泰罗尼亚巴塞罗那卡梅尔山上的公共公园系统,由花园和建筑元素组成。由安东尼·高迪设计,建于1900年至1914年间,该公园最初由尤塞比·奎尔开发为住宅区。它于1926年正式作为公共公园开放。公园展示了高迪独特的建筑和艺术风格,拥有受自然启发的彩色陶瓷马赛克、起伏的形式和有机形状。覆盖着碎瓷砖的著名蛇形长椅提供巴塞罗那和地中海的全景视野。公园包括著名的覆盖着彩色马赛克的龙/蜥蜴雕塑,被称为"埃尔·德拉克",已成为巴塞罗那的象征。',
        historicalInfo: '奎尔公园是安东尼·高迪在1900年至1914年间为尤塞比·奎尔设计的花园城市项目。该项目受到英国花园城市运动的启发。只建造了两所房子,其中一所是高迪从1906年到1925年的家,现在是高迪故居博物馆。1984年,联合国教科文组织将奎尔公园指定为世界遗产。',
        yearBuilt: '1900-1914年',
        architect: '安东尼·高迪'
      }
    }
  },
  {
    id: 'casa_batllo',
    cityId: 'barcelona',
    name: 'Casa Batlló',
    lat: 41.391638,
    lng: 2.164993,
    radius: 50,
    narration: 'Welcome to Casa Batlló, one of Gaudí\'s most imaginative buildings. This stunning modernist masterpiece resembles a living organism with its skeletal facade and dragon-like roof.',
    description: 'Gaudí\'s fantastical modernist building with skeletal facade',
    category: 'Architecture',
    detailedDescription: 'Casa Batlló is a building in the center of Barcelona, renovated by Antoni Gaudí from 1904 to 1906. It is located on Passeig de Gràcia and is one of Gaudí\'s masterpieces. The building is part of a UNESCO World Heritage Site. The local name for the building is Casa dels ossos (House of Bones), as it has a visceral, skeletal organic quality. The facade is decorated with colorful mosaics and has balconies that resemble skulls or masks. The roof is arched and resembles the back of a dragon, with shingles that look like scales. Inside, Gaudí\'s organic design continues with curved walls, mushroom-shaped fireplaces, and a spectacular light well designed to distribute natural light throughout the building.',
    photos: [
      'https://images.unsplash.com/photo-1583779457050-39e95d3d9d8b?w=800',
      'https://images.unsplash.com/photo-1561632669-7f55f7975606?w=800',
      'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800'
    ],
    historicalInfo: 'Casa Batlló was originally built in 1877 by Emili Sala Cortés, one of Gaudí\'s architecture teachers. In 1904, Josep Batlló commissioned Gaudí to renovate the building. Gaudí completely transformed the building between 1904 and 1906. In 2005, Casa Batlló was designated a UNESCO World Heritage Site along with other works by Gaudí.',
    yearBuilt: '1877 (original), 1904-1906 (Gaudí renovation)',
    architect: 'Antoni Gaudí (renovation)',
    translations: {
      en: {
        name: 'Casa Batlló',
        narration: 'Welcome to Casa Batlló, one of Gaudí\'s most imaginative buildings. This stunning modernist masterpiece resembles a living organism with its skeletal facade and dragon-like roof.',
        description: 'Gaudí\'s fantastical modernist building with skeletal facade',
        detailedDescription: 'Casa Batlló is a building in the center of Barcelona, renovated by Antoni Gaudí from 1904 to 1906. It is located on Passeig de Gràcia and is one of Gaudí\'s masterpieces. The building is part of a UNESCO World Heritage Site. The local name for the building is Casa dels ossos (House of Bones), as it has a visceral, skeletal organic quality. The facade is decorated with colorful mosaics and has balconies that resemble skulls or masks. The roof is arched and resembles the back of a dragon, with shingles that look like scales. Inside, Gaudí\'s organic design continues with curved walls, mushroom-shaped fireplaces, and a spectacular light well designed to distribute natural light throughout the building.',
        historicalInfo: 'Casa Batlló was originally built in 1877 by Emili Sala Cortés, one of Gaudí\'s architecture teachers. In 1904, Josep Batlló commissioned Gaudí to renovate the building. Gaudí completely transformed the building between 1904 and 1906. In 2005, Casa Batlló was designated a UNESCO World Heritage Site along with other works by Gaudí.',
        yearBuilt: '1877 (original), 1904-1906 (Gaudí renovation)',
        architect: 'Antoni Gaudí (renovation)'
      },
      ko: {
        name: '카사 바트요',
        narration: '가우디의 가장 상상력 넘치는 건물 중 하나인 카사 바트요에 오신 것을 환영합니다. 이 놀라운 모더니스트 걸작은 골격 같은 파사드와 용처럼 생긴 지붕으로 살아있는 유기체를 닮았습니다.',
        description: '골격 같은 파사드를 가진 가우디의 환상적인 모더니스트 건물',
        detailedDescription: '카사 바트요는 1904년부터 1906년까지 안토니 가우디가 개조한 바르셀로나 중심부의 건물입니다. 그라시아 거리에 위치하며 가우디의 걸작 중 하나입니다. 건물은 유네스코 세계문화유산의 일부입니다. 건물의 현지 이름은 카사 델스 오소스(뼈의 집)로, 내장 기관 같은 골격 유기적 특성을 가지고 있습니다. 파사드는 화려한 모자이크로 장식되어 있으며 두개골이나 가면을 닮은 발코니가 있습니다. 지붕은 아치형이며 용의 등을 닮았으며, 비늘처럼 보이는 지붕 널빤지가 있습니다. 내부에서는 가우디의 유기적 디자인이 곡선 벽, 버섯 모양 벽난로, 건물 전체에 자연광을 분산시키도록 설계된 장관의 채광정으로 계속됩니다.',
        historicalInfo: '카사 바트요는 원래 가우디의 건축 선생님 중 한 명인 에밀리 살라 코르테스에 의해 1877년에 지어졌습니다. 1904년, 호세프 바트요가 가우디에게 건물 개조를 의뢰했습니다. 가우디는 1904년에서 1906년 사이에 건물을 완전히 변모시켰습니다. 2005년, 카사 바트요는 가우디의 다른 작품들과 함께 유네스코 세계문화유산으로 지정되었습니다.',
        yearBuilt: '1877년 (원래), 1904-1906년 (가우디 개조)',
        architect: '안토니 가우디 (개조)'
      },
      ja: {
        name: 'カサ・バトリョ',
        narration: 'ガウディの最も想像力豊かな建物の一つであるカサ・バトリョへようこそ。この見事なモダニズムの傑作は、骨格のようなファサードとドラゴンのような屋根で生きた有機体に似ています。',
        description: '骨格のようなファサードを持つガウディの幻想的なモダニズム建築',
        detailedDescription: 'カサ・バトリョは、1904年から1906年にアントニ・ガウディによって改装されたバルセロナ中心部の建物です。グラシア通りに位置し、ガウディの傑作の一つです。建物はユネスコ世界遺産の一部です。建物の地元名はカサ・デルス・オッソス(骨の家)で、内臓的で骨格的な有機的な特質を持っています。ファサードはカラフルなモザイクで装飾され、頭蓋骨や仮面に似たバルコニーがあります。屋根はアーチ型でドラゴンの背中に似ており、鱗のように見える帯状の屋根板があります。内部では、ガウディの有機的なデザインが曲線の壁、キノコ型の暖炉、建物全体に自然光を分散するように設計された壮大な光の井戸で続いています。',
        historicalInfo: 'カサ・バトリョは元々1877年にガウディの建築教師の一人であるエミリ・サラ・コルテスによって建てられました。1904年、ジョゼップ・バトリョがガウディに建物の改装を依頼しました。ガウディは1904年から1906年の間に建物を完全に変貌させました。2005年、カサ・バトリョはガウディの他の作品とともにユネスコ世界遺産に指定されました。',
        yearBuilt: '1877年 (オリジナル), 1904-1906年 (ガウディ改装)',
        architect: 'アントニ・ガウディ (改装)'
      },
      zh: {
        name: '巴特罗之家',
        narration: '欢迎来到巴特罗之家,高迪最富想象力的建筑之一。这座令人惊叹的现代主义杰作以其骨骼般的立面和龙形屋顶类似于一个活的有机体。',
        description: '高迪幻想的现代主义建筑,拥有骨骼立面',
        detailedDescription: '巴特罗之家是位于巴塞罗那市中心的一座建筑,由安东尼·高迪于1904年至1906年进行翻新。它位于格拉西亚大道上,是高迪的杰作之一。该建筑是联合国教科文组织世界遗产的一部分。该建筑的当地名称是骨头之家(Casa dels ossos),因为它具有内脏的、骨骼的有机特质。立面装饰着彩色马赛克,阳台类似于头骨或面具。屋顶呈拱形,类似于龙的背部,屋瓦看起来像鳞片。在内部,高迪的有机设计继续着,有弯曲的墙壁、蘑菇形壁炉和一个壮观的天井,旨在将自然光分布到整个建筑。',
        historicalInfo: '巴特罗之家最初由高迪的建筑老师之一埃米利·萨拉·科尔特斯于1877年建造。1904年,约瑟普·巴特罗委托高迪翻新这座建筑。高迪在1904年至1906年间彻底改造了这座建筑。2005年,巴特罗之家与高迪的其他作品一起被指定为联合国教科文组织世界遗产。',
        yearBuilt: '1877年 (原建筑), 1904-1906年 (高迪翻新)',
        architect: '安东尼·高迪 (翻新)'
      }
    }
  },
  // Brussels landmarks
  {
    id: 'atomium',
    cityId: 'brussels',
    name: 'Atomium',
    lat: 50.894941,
    lng: 4.341555,
    radius: 70,
    narration: 'Welcome to the Atomium, Brussels\' most iconic landmark. This unique building represents an iron crystal magnified 165 billion times, built for the 1958 World Expo.',
    description: 'Iconic futuristic structure representing an iron atom',
    category: 'Monument',
    detailedDescription: 'The Atomium is a landmark building in Brussels, Belgium, originally constructed for the 1958 Brussels World\'s Fair (Expo 58). It is located on the Heysel/Heizel Plateau in Laeken (northern part of the City of Brussels), where the exhibition took place. Designed by engineer André Waterkeyn and architects André and Jean Polak, it stands 102 meters (335 feet) tall. Its nine 18-meter-diameter stainless steel clad spheres are connected so that the whole forms the shape of a unit cell of an iron crystal magnified 165 billion times. The structure was renovated between 2004 and 2006, and the outside sphere coating was replaced with stainless steel. The Atomium contains exhibition halls and other public spaces, and the top sphere provides a panoramic view of Brussels.',
    photos: [
      'https://images.unsplash.com/photo-1559113513-d5e09c78b9dd?w=800',
      'https://images.unsplash.com/photo-1559113513-d5e09c78b9dd?w=800',
      'https://images.unsplash.com/photo-1559113513-d5e09c78b9dd?w=800'
    ],
    historicalInfo: 'The Atomium was designed for the 1958 Brussels World\'s Fair (Expo 58) by engineer André Waterkeyn. The structure symbolizes the democratic will to maintain peace among all the nations, faith in progress, and an optimistic vision of the future of a modern, new, super-technological world. It was intended to be a temporary structure but became so popular that it was preserved.',
    yearBuilt: '1958',
    architect: 'André Waterkeyn, André Polak, Jean Polak',
    translations: {
      en: {
        name: 'Atomium',
        narration: 'Welcome to the Atomium, Brussels\' most iconic landmark. This unique building represents an iron crystal magnified 165 billion times, built for the 1958 World Expo.',
        description: 'Iconic futuristic structure representing an iron atom',
        detailedDescription: 'The Atomium is a landmark building in Brussels, Belgium, originally constructed for the 1958 Brussels World\'s Fair (Expo 58). It is located on the Heysel/Heizel Plateau in Laeken (northern part of the City of Brussels), where the exhibition took place. Designed by engineer André Waterkeyn and architects André and Jean Polak, it stands 102 meters (335 feet) tall. Its nine 18-meter-diameter stainless steel clad spheres are connected so that the whole forms the shape of a unit cell of an iron crystal magnified 165 billion times. The structure was renovated between 2004 and 2006, and the outside sphere coating was replaced with stainless steel. The Atomium contains exhibition halls and other public spaces, and the top sphere provides a panoramic view of Brussels.',
        historicalInfo: 'The Atomium was designed for the 1958 Brussels World\'s Fair (Expo 58) by engineer André Waterkeyn. The structure symbolizes the democratic will to maintain peace among all the nations, faith in progress, and an optimistic vision of the future of a modern, new, super-technological world. It was intended to be a temporary structure but became so popular that it was preserved.',
        yearBuilt: '1958',
        architect: 'André Waterkeyn, André Polak, Jean Polak'
      },
      ko: {
        name: '아토미움',
        narration: '브뤼셀의 가장 상징적인 랜드마크인 아토미움에 오신 것을 환영합니다. 이 독특한 건물은 1650억 배 확대된 철 결정을 나타내며, 1958년 세계 박람회를 위해 지어졌습니다.',
        description: '철 원자를 나타내는 상징적인 미래지향적 구조물',
        detailedDescription: '아토미움은 벨기에 브뤼셀의 랜드마크 건물로, 원래 1958년 브뤼셀 세계 박람회(Expo 58)를 위해 건설되었습니다. 전시회가 열렸던 브뤼셀시 북부 라켄의 헤이젤/하이젤 고원에 위치해 있습니다. 엔지니어 앙드레 워터케인과 건축가 앙드레 및 장 폴락이 설계했으며, 높이는 102미터(335피트)입니다. 직경 18미터의 스테인리스 스틸 코팅 구체 9개가 연결되어 전체가 1650억 배 확대된 철 결정의 단위 셀 형태를 형성합니다. 구조물은 2004년에서 2006년 사이에 개조되었으며, 외부 구체 코팅이 스테인리스 스틸로 교체되었습니다. 아토미움에는 전시 홀과 기타 공공 공간이 있으며, 최상층 구체에서는 브뤼셀의 파노라마 전망을 제공합니다.',
        historicalInfo: '아토미움은 1958년 브뤼셀 세계 박람회(Expo 58)를 위해 엔지니어 앙드레 워터케인이 설계했습니다. 구조물은 모든 국가 간 평화를 유지하려는 민주적 의지, 진보에 대한 믿음, 현대적이고 새롭고 초기술적인 세계의 미래에 대한 낙관적 비전을 상징합니다. 임시 구조물로 의도되었지만 너무 인기가 있어서 보존되었습니다.',
        yearBuilt: '1958년',
        architect: '앙드레 워터케인, 앙드레 폴락, 장 폴락'
      },
      ja: {
        name: 'アトミウム',
        narration: 'ブリュッセルで最も象徴的なランドマークであるアトミウムへようこそ。この独特な建物は1650億倍に拡大された鉄の結晶を表しており、1958年の万国博覧会のために建てられました。',
        description: '鉄原子を表す象徴的な未来的構造物',
        detailedDescription: 'アトミウムはベルギーのブリュッセルにあるランドマーク建築物で、元々1958年ブリュッセル万国博覧会(Expo 58)のために建設されました。展示会が開催されたブリュッセル市北部のラーケンのヘイゼル/ハイゼル高原に位置しています。エンジニアのアンドレ・ウォーターキンと建築家のアンドレとジャン・ポラックによって設計され、高さは102メートル(335フィート)です。直径18メートルのステンレス鋼で覆われた9つの球体が接続され、全体が1650億倍に拡大された鉄の結晶の単位格子の形を形成しています。構造は2004年から2006年の間に改修され、外部球体のコーティングがステンレス鋼に置き換えられました。アトミウムには展示ホールやその他の公共スペースがあり、最上部の球体からはブリュッセルのパノラマビューを楽しめます。',
        historicalInfo: 'アトミウムは、エンジニアのアンドレ・ウォーターキンによって1958年ブリュッセル万国博覧会(Expo 58)のために設計されました。この構造は、すべての国家間の平和を維持しようとする民主的意志、進歩への信念、そして現代的で新しい超技術的世界の未来に対する楽観的なビジョンを象徴しています。一時的な構造物として意図されましたが、非常に人気があったため保存されました。',
        yearBuilt: '1958年',
        architect: 'アンドレ・ウォーターキン、アンドレ・ポラック、ジャン・ポラック'
      },
      zh: {
        name: '原子球塔',
        narration: '欢迎来到原子球塔,布鲁塞尔最具标志性的地标。这座独特的建筑代表了放大1650亿倍的铁晶体,为1958年世界博览会而建。',
        description: '代表铁原子的标志性未来主义结构',
        detailedDescription: '原子球塔是比利时布鲁塞尔的标志性建筑,最初是为1958年布鲁塞尔世界博览会(Expo 58)建造的。它位于布鲁塞尔市北部拉肯的海塞尔/海泽尔高原,展览会就在那里举行。由工程师安德烈·沃特凯恩和建筑师安德烈和让·波拉克设计,高102米(335英尺)。其九个直径18米的不锈钢包覆球体相连,使整体形成放大1650亿倍的铁晶体单位细胞的形状。该结构在2004年至2006年间进行了翻新,外球体涂层被不锈钢取代。原子球塔包含展览厅和其他公共空间,顶部球体提供布鲁塞尔的全景视图。',
        historicalInfo: '原子球塔是由工程师安德烈·沃特凯恩为1958年布鲁塞尔世界博览会(Expo 58)设计的。该结构象征着维护所有国家间和平的民主意愿、对进步的信念以及对现代、新的、超技术世界未来的乐观愿景。它原本是一个临时结构,但由于太受欢迎而被保留下来。',
        yearBuilt: '1958年',
        architect: '安德烈·沃特凯恩、安德烈·波拉克、让·波拉克'
      }
    }
  },
  {
    id: 'grand_place',
    cityId: 'brussels',
    name: 'Grand Place',
    lat: 50.846574,
    lng: 4.35231,
    radius: 100,
    narration: 'Welcome to the Grand Place, the central square of Brussels and one of the most beautiful squares in Europe. This UNESCO World Heritage Site is surrounded by opulent guildhalls and the City Hall.',
    description: 'Brussels\' magnificent central square with ornate guildhalls',
    category: 'Historic Square',
    detailedDescription: 'The Grand Place or Grote Markt is the central square of Brussels, Belgium. It is surrounded by opulent guildhalls and two larger edifices: the city\'s Town Hall and the King\'s House or Breadhouse building. The square measures 68 by 110 meters (223 by 361 feet) and is entirely paved. The Grand Place is the most important tourist destination and most memorable landmark in Brussels. It was named by UNESCO as a World Heritage Site in 1998. The buildings around the square are excellent examples of Belgian Baroque and Gothic architecture. The guildhalls, previously occupied by medieval craft guilds, feature ornate facades with gilded details. Every two years, the Grand Place hosts the Flower Carpet festival, where the square is covered with a spectacular carpet made of begonias.',
    photos: [
      'https://images.unsplash.com/photo-1559113513-d5e09c78b9dd?w=800',
      'https://images.unsplash.com/photo-1559113513-d5e09c78b9dd?w=800',
      'https://images.unsplash.com/photo-1559113513-d5e09c78b9dd?w=800'
    ],
    historicalInfo: 'The Grand Place\'s construction began in the 11th century. Most of the buildings around the square were destroyed during the bombardment of Brussels by troops of Louis XIV of France in 1695. The square was rebuilt in a remarkably short time and most of the guildhalls were completed within four years. The Town Hall, which dominates the square, dates from the early 15th century.',
    yearBuilt: '11th century (original), 1695-1699 (rebuilt)',
    architect: 'Various architects over centuries',
    translations: {
      en: {
        name: 'Grand Place',
        narration: 'Welcome to the Grand Place, the central square of Brussels and one of the most beautiful squares in Europe. This UNESCO World Heritage Site is surrounded by opulent guildhalls and the City Hall.',
        description: 'Brussels\' magnificent central square with ornate guildhalls',
        detailedDescription: 'The Grand Place or Grote Markt is the central square of Brussels, Belgium. It is surrounded by opulent guildhalls and two larger edifices: the city\'s Town Hall and the King\'s House or Breadhouse building. The square measures 68 by 110 meters (223 by 361 feet) and is entirely paved. The Grand Place is the most important tourist destination and most memorable landmark in Brussels. It was named by UNESCO as a World Heritage Site in 1998. The buildings around the square are excellent examples of Belgian Baroque and Gothic architecture. The guildhalls, previously occupied by medieval craft guilds, feature ornate facades with gilded details. Every two years, the Grand Place hosts the Flower Carpet festival, where the square is covered with a spectacular carpet made of begonias.',
        historicalInfo: 'The Grand Place\'s construction began in the 11th century. Most of the buildings around the square were destroyed during the bombardment of Brussels by troops of Louis XIV of France in 1695. The square was rebuilt in a remarkably short time and most of the guildhalls were completed within four years. The Town Hall, which dominates the square, dates from the early 15th century.',
        yearBuilt: '11th century (original), 1695-1699 (rebuilt)',
        architect: 'Various architects over centuries'
      },
      ko: {
        name: '그랑 플라스',
        narration: '브뤼셀의 중앙 광장이자 유럽에서 가장 아름다운 광장 중 하나인 그랑 플라스에 오신 것을 환영합니다. 이 유네스코 세계문화유산은 화려한 길드하우스와 시청으로 둘러싸여 있습니다.',
        description: '화려한 길드하우스가 있는 브뤼셀의 장엄한 중앙 광장',
        detailedDescription: '그랑 플라스 또는 흐로테 마르크트는 벨기에 브뤼셀의 중앙 광장입니다. 화려한 길드하우스와 두 개의 더 큰 건물인 시청과 왕의 집 또는 빵집 건물로 둘러싸여 있습니다. 광장의 크기는 68 x 110미터(223 x 361피트)이며 전체가 포장되어 있습니다. 그랑 플라스는 브뤼셀에서 가장 중요한 관광지이자 가장 기억에 남는 랜드마크입니다. 1998년 유네스코에 의해 세계문화유산으로 지정되었습니다. 광장 주변의 건물들은 벨기에 바로크 및 고딕 건축의 훌륭한 예입니다. 중세 공예 길드가 이전에 점유했던 길드하우스는 금박 세부 장식이 있는 화려한 파사드를 특징으로 합니다. 2년마다 그랑 플라스는 플라워 카펫 축제를 개최하며, 광장이 베고니아로 만든 장관의 카펫으로 덮입니다.',
        historicalInfo: '그랑 플라스의 건설은 11세기에 시작되었습니다. 광장 주변의 대부분의 건물은 1695년 프랑스의 루이 14세 군대의 브뤼셀 포격 중에 파괴되었습니다. 광장은 놀랍도록 짧은 시간에 재건되었으며 대부분의 길드하우스는 4년 이내에 완성되었습니다. 광장을 지배하는 시청은 15세기 초로 거슬러 올라갑니다.',
        yearBuilt: '11세기 (원래), 1695-1699년 (재건)',
        architect: '여러 세기에 걸친 다양한 건축가'
      },
      ja: {
        name: 'グラン・プラス',
        narration: 'ブリュッセルの中央広場であり、ヨーロッパで最も美しい広場の一つであるグラン・プラスへようこそ。このユネスコ世界遺産は、豪華なギルドハウスと市庁舎に囲まれています。',
        description: '華麗なギルドハウスを持つブリュッセルの壮大な中央広場',
        detailedDescription: 'グラン・プラスまたはフロート・マルクトは、ベルギーのブリュッセルの中央広場です。豪華なギルドハウスと2つのより大きな建造物、市庁舎と王の家またはパン屋の建物に囲まれています。広場は68 x 110メートル(223 x 361フィート)の大きさで、完全に舗装されています。グラン・プラスはブリュッセルで最も重要な観光地であり、最も記憶に残るランドマークです。1998年にユネスコによって世界遺産に指定されました。広場周辺の建物はベルギーのバロックとゴシック建築の優れた例です。中世の職人ギルドが以前占拠していたギルドハウスは、金箔の詳細を備えた華麗なファサードを特徴としています。2年ごとに、グラン・プラスはフラワーカーペット祭りを開催し、広場はベゴニアで作られた壮観なカーペットで覆われます。',
        historicalInfo: 'グラン・プラスの建設は11世紀に始まりました。広場周辺のほとんどの建物は、1695年のフランスのルイ14世の軍隊によるブリュッセル砲撃中に破壊されました。広場は驚くほど短い時間で再建され、ほとんどのギルドハウスは4年以内に完成しました。広場を支配する市庁舎は15世紀初頭にさかのぼります。',
        yearBuilt: '11世紀 (オリジナル), 1695-1699年 (再建)',
        architect: '数世紀にわたるさまざまな建築家'
      },
      zh: {
        name: '大广场',
        narration: '欢迎来到大广场,布鲁塞尔的中央广场,也是欧洲最美丽的广场之一。这个联合国教科文组织世界遗产被华丽的行会大厅和市政厅所环绕。',
        description: '拥有华丽行会大厅的布鲁塞尔壮丽中央广场',
        detailedDescription: '大广场或大市场是比利时布鲁塞尔的中央广场。它被华丽的行会大厅和两座更大的建筑所环绕:城市的市政厅和国王之家或面包房建筑。广场面积为68 x 110米(223 x 361英尺),全部铺砌。大广场是布鲁塞尔最重要的旅游目的地和最令人难忘的地标。它于1998年被联合国教科文组织列为世界遗产。广场周围的建筑是比利时巴洛克和哥特式建筑的优秀范例。以前由中世纪手工业行会占据的行会大厅,其立面装饰华丽,镀金细节。每两年,大广场举办花毯节,广场被由秋海棠制成的壮观地毯覆盖。',
        historicalInfo: '大广场的建设始于11世纪。广场周围的大多数建筑在1695年法国路易十四的军队轰炸布鲁塞尔期间被摧毁。广场在极短的时间内重建,大多数行会大厅在四年内完成。主导广场的市政厅可追溯到15世纪初。',
        yearBuilt: '11世纪 (原建筑), 1695-1699年 (重建)',
        architect: '几个世纪以来的各种建筑师'
      }
    }
  },
  // Prague landmarks
  {
    id: 'charles_bridge',
    cityId: 'prague',
    name: 'Charles Bridge',
    lat: 50.086389,
    lng: 14.411389,
    radius: 80,
    narration: 'Welcome to Charles Bridge, one of Prague\'s most iconic landmarks. This historic stone bridge crosses the Vltava river and connects the Old Town with Lesser Town.',
    description: 'Historic stone bridge adorned with 30 baroque statues',
    category: 'Historic Bridge',
    detailedDescription: 'Charles Bridge is a famous historic bridge that crosses the Vltava river in Prague, Czech Republic. Its construction started in 1357 under the auspices of King Charles IV and finished in the early 15th century. The bridge replaced the old Judith Bridge built 1158–1172 that had been badly damaged by a flood in 1342. This new bridge was originally called Stone Bridge or Prague Bridge but has been Charles Bridge since 1870. As the only means of crossing the river Vltava until 1841, Charles Bridge was the most important connection between Prague Castle and the city\'s Old Town and adjacent areas. The bridge is 516 meters long and nearly 10 meters wide, resting on 16 arches shielded by ice guards. It is protected by three bridge towers, two on the Lesser Quarter side and one on the Old Town side, the Old Town Bridge Tower being one of the most astonishing civil gothic-style buildings in the world. The bridge is decorated by a continuous alley of 30 statues and statuaries, most of them baroque-style, erected around 1700. Today, the Charles Bridge is one of the most visited sights in Prague with painters, street musicians, and other artists. It offers a stunning view of Prague Castle and is especially beautiful at sunrise or sunset.',
    photos: [
      'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800',
      'https://images.unsplash.com/photo-1458150945447-7fb764c11a92?w=800',
      'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800'
    ],
    historicalInfo: 'Charles Bridge was built to replace the Judith Bridge that had been badly damaged by floods in 1342. Construction began in 1357 under King Charles IV and was completed in the early 15th century. The bridge served as the only crossing over the Vltava River until 1841.',
    yearBuilt: '1357-1402',
    architect: 'Peter Parler',
    translations: {
      en: {
        name: 'Charles Bridge',
        narration: 'Welcome to Charles Bridge, one of Prague\'s most iconic landmarks. This historic stone bridge crosses the Vltava river and connects the Old Town with Lesser Town.',
        description: 'Historic stone bridge adorned with 30 baroque statues',
        detailedDescription: 'Charles Bridge is a famous historic bridge that crosses the Vltava river in Prague, Czech Republic. Its construction started in 1357 under the auspices of King Charles IV and finished in the early 15th century. The bridge replaced the old Judith Bridge built 1158–1172 that had been badly damaged by a flood in 1342. This new bridge was originally called Stone Bridge or Prague Bridge but has been Charles Bridge since 1870. As the only means of crossing the river Vltava until 1841, Charles Bridge was the most important connection between Prague Castle and the city\'s Old Town and adjacent areas. The bridge is 516 meters long and nearly 10 meters wide, resting on 16 arches shielded by ice guards. It is protected by three bridge towers, two on the Lesser Quarter side and one on the Old Town side, the Old Town Bridge Tower being one of the most astonishing civil gothic-style buildings in the world. The bridge is decorated by a continuous alley of 30 statues and statuaries, most of them baroque-style, erected around 1700. Today, the Charles Bridge is one of the most visited sights in Prague with painters, street musicians, and other artists. It offers a stunning view of Prague Castle and is especially beautiful at sunrise or sunset.',
        historicalInfo: 'Charles Bridge was built to replace the Judith Bridge that had been badly damaged by floods in 1342. Construction began in 1357 under King Charles IV and was completed in the early 15th century. The bridge served as the only crossing over the Vltava River until 1841.',
        yearBuilt: '1357-1402',
        architect: 'Peter Parler'
      },
      ko: {
        name: '카를교',
        narration: '프라하에서 가장 상징적인 랜드마크 중 하나인 카를교에 오신 것을 환영합니다. 이 역사적인 석조 다리는 블타바 강을 가로지르며 구시가지와 소지구를 연결합니다.',
        description: '30개의 바로크 조각상으로 장식된 역사적인 석조 다리',
        detailedDescription: '카를교는 체코 프라하의 블타바 강을 가로지르는 유명한 역사적인 다리입니다. 건설은 1357년 카를 4세의 후원 하에 시작되어 15세기 초에 완공되었습니다. 이 다리는 1342년 홍수로 심하게 손상된 1158-1172년에 지어진 구 유디트 다리를 대체했습니다. 이 새로운 다리는 원래 석조 다리 또는 프라하 다리라고 불렸지만 1870년부터 카를교로 불리고 있습니다. 1841년까지 블타바 강을 건너는 유일한 수단으로서 카를교는 프라하 성과 도시의 구시가지 및 인접 지역 사이의 가장 중요한 연결고리였습니다. 다리는 길이 516미터, 폭 거의 10미터로 얼음 방호벽으로 보호되는 16개의 아치 위에 놓여 있습니다. 다리는 세 개의 다리 탑으로 보호되는데, 소지구 쪽에 두 개, 구시가지 쪽에 하나가 있으며, 구시가지 다리 탑은 세계에서 가장 놀라운 시민 고딕 양식 건물 중 하나입니다. 다리는 대부분 바로크 양식인 30개의 조각상과 조각품이 연속적인 골목을 장식하고 있으며, 대부분 1700년경에 세워졌습니다. 오늘날 카를교는 화가, 거리 음악가, 기타 예술가들과 함께 프라하에서 가장 많이 방문하는 명소 중 하나입니다. 프라하 성의 멋진 전망을 제공하며 일출이나 일몰 시 특히 아름답습니다.',
        historicalInfo: '카를교는 1342년 홍수로 심하게 손상된 유디트 다리를 대체하기 위해 건설되었습니다. 건설은 1357년 카를 4세 치하에 시작되어 15세기 초에 완공되었습니다. 이 다리는 1841년까지 블타바 강을 건너는 유일한 통로였습니다.',
        yearBuilt: '1357-1402년',
        architect: '페터 파를러'
      },
      ja: {
        name: 'カレル橋',
        narration: 'プラハで最も象徴的なランドマークの一つであるカレル橋へようこそ。この歴史的な石橋はヴルタヴァ川を渡り、旧市街と小地区を結んでいます。',
        description: '30体のバロック彫像で装飾された歴史的な石橋',
        detailedDescription: 'カレル橋は、チェコのプラハでヴルタヴァ川を渡る有名な歴史的な橋です。建設は1357年にカレル4世の後援の下で始まり、15世紀初頭に完成しました。この橋は、1342年の洪水で大きな被害を受けた1158年から1172年に建設された旧ユディット橋を置き換えました。この新しい橋は当初、石橋またはプラハ橋と呼ばれていましたが、1870年からカレル橋と呼ばれています。1841年までヴルタヴァ川を渡る唯一の手段として、カレル橋はプラハ城と市の旧市街および隣接地域との間の最も重要な接続でした。橋の長さは516メートル、幅は約10メートルで、氷の防護柵で保護された16のアーチの上に置かれています。橋は3つの橋塔で保護されており、小地区側に2つ、旧市街側に1つあり、旧市街橋塔は世界で最も驚くべき市民ゴシック様式の建物の1つです。橋は、ほとんどがバロック様式の30体の彫像と彫刻で装飾された連続した路地で飾られており、ほとんどが1700年頃に建てられました。今日、カレル橋は画家、ストリートミュージシャン、その他のアーティストと共にプラハで最も訪問された名所の1つです。プラハ城の素晴らしい景色を提供し、日の出や日没時に特に美しいです。',
        historicalInfo: 'カレル橋は、1342年の洪水で大きな被害を受けたユディット橋を置き換えるために建設されました。建設は1357年にカレル4世の下で始まり、15世紀初頭に完成しました。この橋は1841年までヴルタヴァ川を渡る唯一の通路でした。',
        yearBuilt: '1357-1402年',
        architect: 'ペーター・パルレーシュ'
      },
      zh: {
        name: '查理大桥',
        narration: '欢迎来到查理大桥,布拉格最具标志性的地标之一。这座历史悠久的石桥横跨伏尔塔瓦河,连接老城和小城区。',
        description: '装饰有30座巴洛克雕像的历史石桥',
        detailedDescription: '查理大桥是横跨捷克布拉格伏尔塔瓦河的著名历史桥梁。建设始于1357年,在查理四世的资助下开始,并于15世纪初完工。这座桥取代了1158-1172年建造、在1342年洪水中严重受损的旧朱迪特桥。这座新桥最初被称为石桥或布拉格桥,但自1870年以来一直被称为查理大桥。作为1841年之前唯一横跨伏尔塔瓦河的通道,查理大桥是布拉格城堡与城市老城及邻近地区之间最重要的连接。大桥长516米,宽近10米,坐落在由冰护栏保护的16个拱门上。它由三座桥塔保护,两座位于小城区一侧,一座位于老城一侧,老城桥塔是世界上最令人惊叹的哥特式民用建筑之一。大桥由30座雕像和雕塑的连续小巷装饰,大多数是巴洛克风格,建于1700年左右。今天,查理大桥是布拉格访问量最大的景点之一,有画家、街头音乐家和其他艺术家。它提供布拉格城堡的壮丽景色,在日出或日落时特别美丽。',
        historicalInfo: '查理大桥是为了取代1342年洪水中严重受损的朱迪特桥而建造的。建设始于1357年查理四世治下,并于15世纪初完工。大桥在1841年之前一直是唯一横跨伏尔塔瓦河的通道。',
        yearBuilt: '1357-1402年',
        architect: '彼得·帕勒'
      }
    }
  },
  {
    id: 'prague_castle',
    cityId: 'prague',
    name: 'Prague Castle',
    lat: 50.090833,
    lng: 14.400556,
    radius: 100,
    narration: 'Welcome to Prague Castle, one of the largest ancient castles in the world. This magnificent complex has been the seat of power for kings, emperors, and presidents for over a thousand years.',
    description: 'The largest ancient castle complex in the world',
    category: 'Historic Castle',
    detailedDescription: 'Prague Castle is a castle complex in Prague, Czech Republic, built in the 9th century. It is the official office of the President of the Czech Republic and was once the seat of Bohemian kings and Holy Roman emperors. The castle is among the most visited tourist attractions in Prague attracting over 1.8 million visitors annually. The Bohemian Crown Jewels are kept within a hidden room inside it. According to the Guinness Book of Records, Prague Castle is the largest ancient castle in the world, occupying an area of almost 70,000 square meters. The castle includes Gothic St. Vitus Cathedral, Romanesque Basilica of St. George, a monastery, and several palaces, gardens and defense towers. Most of the castle\'s present appearance is a result of reconstruction in the second half of the 18th century. The castle houses the Czech Crown Jewels and is a UNESCO World Heritage Site. The changing of the guard takes place every hour and is a popular attraction.',
    photos: [
      'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800',
      'https://images.unsplash.com/photo-1458150945447-7fb764c11a92?w=800',
      'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800'
    ],
    historicalInfo: 'Prague Castle was founded around 880 by Prince Bořivoj of the Přemyslid Dynasty. It has been rebuilt and expanded many times over the centuries. The castle has always been the seat of power for Czech rulers and is now the official residence of the President of the Czech Republic.',
    yearBuilt: '880 AD',
    architect: 'Various architects over centuries',
    translations: {
      en: {
        name: 'Prague Castle',
        narration: 'Welcome to Prague Castle, one of the largest ancient castles in the world. This magnificent complex has been the seat of power for kings, emperors, and presidents for over a thousand years.',
        description: 'The largest ancient castle complex in the world',
        detailedDescription: 'Prague Castle is a castle complex in Prague, Czech Republic, built in the 9th century. It is the official office of the President of the Czech Republic and was once the seat of Bohemian kings and Holy Roman emperors. The castle is among the most visited tourist attractions in Prague attracting over 1.8 million visitors annually. The Bohemian Crown Jewels are kept within a hidden room inside it. According to the Guinness Book of Records, Prague Castle is the largest ancient castle in the world, occupying an area of almost 70,000 square meters. The castle includes Gothic St. Vitus Cathedral, Romanesque Basilica of St. George, a monastery, and several palaces, gardens and defense towers. Most of the castle\'s present appearance is a result of reconstruction in the second half of the 18th century. The castle houses the Czech Crown Jewels and is a UNESCO World Heritage Site. The changing of the guard takes place every hour and is a popular attraction.',
        historicalInfo: 'Prague Castle was founded around 880 by Prince Bořivoj of the Přemyslid Dynasty. It has been rebuilt and expanded many times over the centuries. The castle has always been the seat of power for Czech rulers and is now the official residence of the President of the Czech Republic.',
        yearBuilt: '880 AD',
        architect: 'Various architects over centuries'
      },
      ko: {
        name: '프라하 성',
        narration: '세계에서 가장 큰 고대 성 중 하나인 프라하 성에 오신 것을 환영합니다. 이 장엄한 복합 건물은 천년 이상 왕, 황제, 대통령의 권력의 자리였습니다.',
        description: '세계에서 가장 큰 고대 성 복합 건물',
        detailedDescription: '프라하 성은 9세기에 건축된 체코 프라하의 성 복합 건물입니다. 체코 공화국 대통령의 공식 집무실이며 한때 보헤미아 왕과 신성 로마 제국 황제의 자리였습니다. 이 성은 프라하에서 가장 많이 방문하는 관광 명소 중 하나로 연간 180만 명 이상의 방문객을 끌어들입니다. 보헤미아 왕관 보석은 성 내부의 숨겨진 방에 보관되어 있습니다. 기네스북에 따르면 프라하 성은 세계에서 가장 큰 고대 성으로 거의 70,000제곱미터의 면적을 차지합니다. 성에는 고딕 양식의 성 비투스 대성당, 로마네스크 양식의 성 조지 대성당, 수도원, 여러 궁전, 정원 및 방어 탑이 포함됩니다. 성의 현재 모습 대부분은 18세기 후반 재건의 결과입니다. 성에는 체코 왕관 보석이 보관되어 있으며 유네스코 세계문화유산입니다. 위병 교대식은 매시간 진행되며 인기 있는 명소입니다.',
        historicalInfo: '프라하 성은 880년경 프르셰미슬 왕조의 보르지보이 공작에 의해 건립되었습니다. 수세기에 걸쳐 여러 차례 재건 및 확장되었습니다. 이 성은 항상 체코 통치자의 권력의 자리였으며 현재 체코 공화국 대통령의 공식 거주지입니다.',
        yearBuilt: '서기 880년',
        architect: '여러 세기에 걸친 다양한 건축가'
      },
      ja: {
        name: 'プラハ城',
        narration: '世界最大級の古代城の一つであるプラハ城へようこそ。この壮大な複合施設は、千年以上にわたり王、皇帝、大統領の権力の座でした。',
        description: '世界最大の古代城郭複合体',
        detailedDescription: 'プラハ城は、9世紀に建設されたチェコのプラハにある城郭複合体です。チェコ共和国大統領の公式執務室であり、かつてボヘミア王と神聖ローマ皇帝の座でした。この城はプラハで最も訪問された観光名所の一つで、年間180万人以上の訪問者を集めています。ボヘミア王冠宝石は城内の隠し部屋に保管されています。ギネスブックによると、プラハ城は世界最大の古代城で、約70,000平方メートルの面積を占めています。城にはゴシック様式の聖ヴィート大聖堂、ロマネスク様式の聖ジョージ教会、修道院、いくつかの宮殿、庭園、防衛塔が含まれます。城の現在の外観の大部分は、18世紀後半の再建の結果です。城にはチェコ王冠宝石が収蔵されており、ユネスコ世界遺産です。衛兵交代式は毎時行われ、人気のアトラクションです。',
        historicalInfo: 'プラハ城は880年頃、プシェミスル朝のボジヴォイ公によって建設されました。何世紀にもわたって何度も再建され拡張されました。この城は常にチェコ統治者の権力の座であり、現在はチェコ共和国大統領の公式住居です。',
        yearBuilt: '西暦880年',
        architect: '数世紀にわたるさまざまな建築家'
      },
      zh: {
        name: '布拉格城堡',
        narration: '欢迎来到布拉格城堡,世界上最大的古代城堡之一。这座宏伟的建筑群一千多年来一直是国王、皇帝和总统的权力所在地。',
        description: '世界上最大的古代城堡建筑群',
        detailedDescription: '布拉格城堡是捷克布拉格的一座城堡建筑群,建于9世纪。它是捷克共和国总统的官方办公室,曾经是波希米亚国王和神圣罗马帝国皇帝的所在地。该城堡是布拉格访问量最大的旅游景点之一,每年吸引超过180万游客。波希米亚王冠珠宝保存在城堡内的一个隐藏房间中。根据吉尼斯世界纪录,布拉格城堡是世界上最大的古代城堡,占地面积近70,000平方米。城堡包括哥特式圣维特大教堂、罗马式圣乔治教堂、修道院以及几座宫殿、花园和防御塔。城堡目前的外观大部分是18世纪后半叶重建的结果。城堡收藏着捷克王冠珠宝,是联合国教科文组织世界遗产。卫兵换岗仪式每小时举行一次,是一个受欢迎的景点。',
        historicalInfo: '布拉格城堡大约在880年由普热米斯尔王朝的博日沃伊王子建立。几个世纪以来,它被多次重建和扩建。这座城堡一直是捷克统治者的权力所在地,现在是捷克共和国总统的官方住所。',
        yearBuilt: '公元880年',
        architect: '几个世纪以来的各种建筑师'
      }
    }
  },
  {
    id: 'old_town_square',
    cityId: 'prague',
    name: 'Old Town Square',
    lat: 50.087465,
    lng: 14.421254,
    radius: 90,
    narration: 'Welcome to Old Town Square, the historic heart of Prague. This beautiful square features the famous Astronomical Clock and stunning architecture spanning multiple centuries.',
    description: 'Historic square with the famous Astronomical Clock',
    category: 'Historic Square',
    detailedDescription: 'The Old Town Square is a historic square in the Old Town quarter of Prague, the capital of the Czech Republic. It is located between Wenceslas Square and Charles Bridge. The square features various architectural styles including Gothic, Renaissance, Baroque, and Rococo. The centerpiece is the Church of Our Lady before Týn with its distinctive twin towers. The square also features the Old Town Hall with the famous Prague Astronomical Clock, which dates from 1410. This clock is one of the oldest and most elaborate astronomical clocks in the world. Every hour, crowds gather to watch the clock\'s hourly show of moving Apostle figures and other sculptures. The square has been a witness to many important events in Czech history. A memorial in the pavement marks the spot where 27 Czech nobles were executed in 1621 following the Battle of White Mountain. Today, Old Town Square is a vibrant gathering place with outdoor cafes, seasonal markets, and street performers.',
    photos: [
      'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800',
      'https://images.unsplash.com/photo-1458150945447-7fb764c11a92?w=800',
      'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800'
    ],
    historicalInfo: 'The Old Town Square has been Prague\'s principal public square since the 10th century. It has witnessed numerous historical events including demonstrations, celebrations, and public executions. The square became the center of Prague\'s economic and political life during the Middle Ages.',
    yearBuilt: '10th century',
    architect: 'Various architects over centuries',
    translations: {
      en: {
        name: 'Old Town Square',
        narration: 'Welcome to Old Town Square, the historic heart of Prague. This beautiful square features the famous Astronomical Clock and stunning architecture spanning multiple centuries.',
        description: 'Historic square with the famous Astronomical Clock',
        detailedDescription: 'The Old Town Square is a historic square in the Old Town quarter of Prague, the capital of the Czech Republic. It is located between Wenceslas Square and Charles Bridge. The square features various architectural styles including Gothic, Renaissance, Baroque, and Rococo. The centerpiece is the Church of Our Lady before Týn with its distinctive twin towers. The square also features the Old Town Hall with the famous Prague Astronomical Clock, which dates from 1410. This clock is one of the oldest and most elaborate astronomical clocks in the world. Every hour, crowds gather to watch the clock\'s hourly show of moving Apostle figures and other sculptures. The square has been a witness to many important events in Czech history. A memorial in the pavement marks the spot where 27 Czech nobles were executed in 1621 following the Battle of White Mountain. Today, Old Town Square is a vibrant gathering place with outdoor cafes, seasonal markets, and street performers.',
        historicalInfo: 'The Old Town Square has been Prague\'s principal public square since the 10th century. It has witnessed numerous historical events including demonstrations, celebrations, and public executions. The square became the center of Prague\'s economic and political life during the Middle Ages.',
        yearBuilt: '10th century',
        architect: 'Various architects over centuries'
      },
      ko: {
        name: '구시가지 광장',
        narration: '프라하의 역사적 중심인 구시가지 광장에 오신 것을 환영합니다. 이 아름다운 광장에는 유명한 천문 시계와 여러 세기에 걸친 멋진 건축물이 있습니다.',
        description: '유명한 천문 시계가 있는 역사적인 광장',
        detailedDescription: '구시가지 광장은 체코 공화국의 수도 프라하의 구시가지 지구에 있는 역사적인 광장입니다. 바츨라프 광장과 카를교 사이에 위치합니다. 광장에는 고딕, 르네상스, 바로크, 로코코 등 다양한 건축 양식이 있습니다. 중심에는 독특한 쌍둥이 탑이 있는 틴 성모 교회가 있습니다. 광장에는 또한 1410년부터 있는 유명한 프라하 천문 시계가 있는 구시청사가 있습니다. 이 시계는 세계에서 가장 오래되고 정교한 천문 시계 중 하나입니다. 매시간 군중이 모여 움직이는 사도 인형과 기타 조각품의 시계 쇼를 봅니다. 광장은 체코 역사의 많은 중요한 사건의 증인이었습니다. 포장도로의 기념비는 백산 전투 이후 1621년에 27명의 체코 귀족이 처형된 장소를 표시합니다. 오늘날 구시가지 광장은 야외 카페, 계절 시장, 거리 공연자들이 있는 활기찬 모임 장소입니다.',
        historicalInfo: '구시가지 광장은 10세기부터 프라하의 주요 공공 광장이었습니다. 시위, 축하 행사, 공개 처형을 포함한 수많은 역사적 사건을 목격했습니다. 광장은 중세 시대에 프라하의 경제 및 정치 생활의 중심이 되었습니다.',
        yearBuilt: '10세기',
        architect: '여러 세기에 걸친 다양한 건축가'
      },
      ja: {
        name: '旧市街広場',
        narration: 'プラハの歴史的中心である旧市街広場へようこそ。この美しい広場には有名な天文時計と数世紀にわたる素晴らしい建築があります。',
        description: '有名な天文時計がある歴史的な広場',
        detailedDescription: '旧市街広場は、チェコ共和国の首都プラハの旧市街地区にある歴史的な広場です。ヴァーツラフ広場とカレル橋の間に位置しています。広場にはゴシック、ルネサンス、バロック、ロココなど、さまざまな建築様式があります。中心には、特徴的な双塔を持つティーン教会があります。広場にはまた、1410年からある有名なプラハの天文時計がある旧市庁舎があります。この時計は世界で最も古く精巧な天文時計の一つです。毎時、群衆が集まって動く使徒の人形やその他の彫刻の時計のショーを見ます。広場はチェコの歴史の多くの重要な出来事の証人でした。舗装の記念碑は、白山の戦いの後の1621年に27人のチェコ貴族が処刑された場所を示しています。今日、旧市街広場は屋外カフェ、季節の市場、ストリートパフォーマーがいる活気のある集まりの場所です。',
        historicalInfo: '旧市街広場は10世紀からプラハの主要な公共広場でした。デモ、祝賀、公開処刑を含む多くの歴史的出来事を目撃しました。広場は中世にプラハの経済的および政治的生活の中心になりました。',
        yearBuilt: '10世紀',
        architect: '数世紀にわたるさまざまな建築家'
      },
      zh: {
        name: '老城广场',
        narration: '欢迎来到老城广场,布拉格的历史中心。这个美丽的广场拥有著名的天文钟和横跨数个世纪的令人惊叹的建筑。',
        description: '拥有著名天文钟的历史广场',
        detailedDescription: '老城广场是捷克共和国首都布拉格老城区的一个历史广场。它位于瓦茨拉夫广场和查理大桥之间。广场展现了包括哥特式、文艺复兴、巴洛克和洛可可在内的各种建筑风格。中心是提恩教堂,其标志性的双塔。广场还有老市政厅,拥有著名的布拉格天文钟,可追溯到1410年。这座钟是世界上最古老和最精致的天文钟之一。每个小时,人群聚集观看钟表的移动使徒人物和其他雕塑的表演。广场见证了捷克历史上的许多重要事件。人行道上的纪念碑标志着白山战役后1621年27名捷克贵族被处决的地点。今天,老城广场是一个充满活力的聚会场所,有户外咖啡馆、季节性市场和街头表演者。',
        historicalInfo: '老城广场自10世纪以来一直是布拉格的主要公共广场。它见证了包括示威、庆祝活动和公开处决在内的众多历史事件。广场在中世纪成为布拉格经济和政治生活的中心。',
        yearBuilt: '10世纪',
        architect: '几个世纪以来的各种建筑师'
      }
    }
  },
  // Budapest landmarks
  {
    id: 'parliament_building',
    cityId: 'budapest',
    name: 'Hungarian Parliament Building',
    lat: 47.507222,
    lng: 19.045556,
    radius: 100,
    narration: 'Welcome to the Hungarian Parliament Building, one of Europe\'s oldest legislative buildings and a stunning example of Neo-Gothic architecture on the banks of the Danube River.',
    description: 'Magnificent Neo-Gothic parliament building on the Danube',
    category: 'Government Building',
    detailedDescription: 'The Hungarian Parliament Building, also known as the Parliament of Budapest, is the seat of the National Assembly of Hungary, a notable landmark of Hungary, and a popular tourist destination in Budapest. It is situated on Kossuth Square in the Pest side of the city, on the eastern bank of the Danube. It is currently the largest building in Hungary and the tallest building in Budapest. The building is in the Gothic Revival style and has a symmetrical facade and a central dome. It is 268 meters long and 123 meters wide, and has 691 rooms. The building was designed and built in the Gothic Revival style by the Hungarian architect Imre Steindl and was completed in 1904. The dome, along with several other parts of the building, was designed to be reminiscent of the British Houses of Parliament. The Hungarian Parliament Building houses the Hungarian Crown Jewels, including the Holy Crown of Hungary.',
    photos: [
      'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=800',
      'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800',
      'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800'
    ],
    historicalInfo: 'The Hungarian Parliament Building was constructed from 1885 to 1904 during the time of the Austro-Hungarian Empire. The design was inspired by the Palace of Westminster in London and symbolized the Hungarian nation\'s aspirations for independence and self-governance.',
    yearBuilt: '1885-1904',
    architect: 'Imre Steindl',
    translations: {
      en: {
        name: 'Hungarian Parliament Building',
        narration: 'Welcome to the Hungarian Parliament Building, one of Europe\'s oldest legislative buildings and a stunning example of Neo-Gothic architecture on the banks of the Danube River.',
        description: 'Magnificent Neo-Gothic parliament building on the Danube',
        detailedDescription: 'The Hungarian Parliament Building, also known as the Parliament of Budapest, is the seat of the National Assembly of Hungary, a notable landmark of Hungary, and a popular tourist destination in Budapest. It is situated on Kossuth Square in the Pest side of the city, on the eastern bank of the Danube. It is currently the largest building in Hungary and the tallest building in Budapest. The building is in the Gothic Revival style and has a symmetrical facade and a central dome. It is 268 meters long and 123 meters wide, and has 691 rooms. The building was designed and built in the Gothic Revival style by the Hungarian architect Imre Steindl and was completed in 1904. The dome, along with several other parts of the building, was designed to be reminiscent of the British Houses of Parliament. The Hungarian Parliament Building houses the Hungarian Crown Jewels, including the Holy Crown of Hungary.',
        historicalInfo: 'The Hungarian Parliament Building was constructed from 1885 to 1904 during the time of the Austro-Hungarian Empire. The design was inspired by the Palace of Westminster in London and symbolized the Hungarian nation\'s aspirations for independence and self-governance.',
        yearBuilt: '1885-1904',
        architect: 'Imre Steindl'
      },
      ko: {
        name: '헝가리 국회의사당',
        narration: '유럽에서 가장 오래된 입법 건물 중 하나이자 도나우 강변의 멋진 네오 고딕 건축의 예인 헝가리 국회의사당에 오신 것을 환영합니다.',
        description: '도나우 강변의 장엄한 네오 고딕 국회의사당',
        detailedDescription: '헝가리 국회의사당은 부다페스트 국회의사당으로도 알려져 있으며, 헝가리 국민의회의 소재지이자 헝가리의 주요 랜드마크이며 부다페스트의 인기 있는 관광지입니다. 도시의 페스트 쪽, 도나우 강의 동쪽 강둑에 있는 코슈트 광장에 위치하고 있습니다. 현재 헝가리에서 가장 큰 건물이자 부다페스트에서 가장 높은 건물입니다. 건물은 고딕 부흥 양식이며 대칭적인 파사드와 중앙 돔이 있습니다. 길이 268미터, 폭 123미터이며 691개의 방이 있습니다. 건물은 헝가리 건축가 임레 슈타인들에 의해 고딕 부흥 양식으로 설계 및 건축되었으며 1904년에 완공되었습니다. 돔은 건물의 다른 여러 부분과 함께 영국 국회의사당을 연상시키도록 설계되었습니다. 헝가리 국회의사당에는 헝가리의 성 왕관을 포함한 헝가리 왕관 보석이 보관되어 있습니다.',
        historicalInfo: '헝가리 국회의사당은 오스트리아-헝가리 제국 시대인 1885년부터 1904년까지 건설되었습니다. 디자인은 런던의 웨스트민스터 궁전에서 영감을 받았으며 독립과 자치에 대한 헝가리 국가의 열망을 상징했습니다.',
        yearBuilt: '1885-1904년',
        architect: '임레 슈타인들'
      },
      ja: {
        name: 'ハンガリー国会議事堂',
        narration: 'ヨーロッパで最も古い立法建築の一つであり、ドナウ川沿いの見事なネオゴシック建築の例であるハンガリー国会議事堂へようこそ。',
        description: 'ドナウ川沿いの壮大なネオゴシック国会議事堂',
        detailedDescription: 'ハンガリー国会議事堂は、ブダペスト国会議事堂としても知られ、ハンガリー国民議会の議席であり、ハンガリーの注目すべきランドマークであり、ブダペストの人気の観光地です。市のペスト側、ドナウ川の東岸にあるコシュート広場に位置しています。現在、ハンガリーで最大の建物であり、ブダペストで最も高い建物です。建物はゴシック・リバイバル様式で、対称的なファサードと中央のドームがあります。長さ268メートル、幅123メートルで、691の部屋があります。建物はハンガリーの建築家イムレ・シュタインドルによってゴシック・リバイバル様式で設計・建設され、1904年に完成しました。ドームは建物の他のいくつかの部分とともに、英国国会議事堂を思い起こさせるように設計されました。ハンガリー国会議事堂には、ハンガリーの聖なる王冠を含むハンガリー王冠宝石が収蔵されています。',
        historicalInfo: 'ハンガリー国会議事堂は、オーストリア・ハンガリー帝国時代の1885年から1904年にかけて建設されました。設計はロンドンのウェストミンスター宮殿に触発され、独立と自治に対するハンガリー国家の願望を象徴していました。',
        yearBuilt: '1885-1904年',
        architect: 'イムレ・シュタインドル'
      },
      zh: {
        name: '匈牙利国会大厦',
        narration: '欢迎来到匈牙利国会大厦,欧洲最古老的立法建筑之一,也是多瑙河畔新哥特式建筑的惊人典范。',
        description: '多瑙河畔壮丽的新哥特式国会大厦',
        detailedDescription: '匈牙利国会大厦,也被称为布达佩斯国会大厦,是匈牙利国民议会的所在地,匈牙利的著名地标,也是布达佩斯的热门旅游目的地。它位于城市佩斯一侧多瑙河东岸的科苏特广场。它目前是匈牙利最大的建筑,也是布达佩斯最高的建筑。该建筑采用哥特式复兴风格,具有对称的立面和中央圆顶。它长268米,宽123米,有691个房间。该建筑由匈牙利建筑师伊姆雷·施泰因德尔设计并以哥特式复兴风格建造,并于1904年完工。圆顶以及建筑的其他几个部分被设计成让人联想起英国国会大厦。匈牙利国会大厦收藏着匈牙利王冠珠宝,包括匈牙利神圣王冠。',
        historicalInfo: '匈牙利国会大厦建于1885年至1904年奥匈帝国时期。设计灵感来自伦敦的威斯敏斯特宫,象征着匈牙利民族对独立和自治的渴望。',
        yearBuilt: '1885-1904年',
        architect: '伊姆雷·施泰因德尔'
      }
    }
  },
  {
    id: 'chain_bridge',
    cityId: 'budapest',
    name: 'Chain Bridge',
    lat: 47.498611,
    lng: 19.042778,
    radius: 70,
    narration: 'Welcome to the Chain Bridge, the first permanent bridge across the Danube in Budapest. This iconic suspension bridge connects Buda and Pest, symbolizing the unity of the city.',
    description: 'Historic suspension bridge connecting Buda and Pest',
    category: 'Historic Bridge',
    detailedDescription: 'The Széchenyi Chain Bridge is a suspension bridge that spans the River Danube between Buda and Pest, the western and eastern sides of Budapest, the capital of Hungary. Designed by English engineer William Tierney Clark and built by Scottish engineer Adam Clark, it was the first permanent bridge across the Danube in Budapest and was opened in 1849. The bridge is named after Count István Széchenyi, a major supporter of its construction. At the time of its construction, it was regarded as one of the modern world\'s engineering wonders. The bridge has a total length of 375 meters and a width of 14.8 meters. The two main supporting towers are 48 meters high and are built of stone. The bridge is decorated with stone lion sculptures at both ends. The Chain Bridge was destroyed during World War II and was rebuilt and reopened in 1949. It has become one of the most famous landmarks of Budapest.',
    photos: [
      'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=800',
      'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800',
      'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800'
    ],
    historicalInfo: 'The Chain Bridge was built between 1839 and 1849, designed by William Tierney Clark and constructed by Adam Clark. It was the first permanent bridge to connect Buda and Pest. The bridge was destroyed during World War II and was rebuilt for its 100th anniversary in 1949.',
    yearBuilt: '1839-1849',
    architect: 'William Tierney Clark (design), Adam Clark (construction)',
    translations: {
      en: {
        name: 'Chain Bridge',
        narration: 'Welcome to the Chain Bridge, the first permanent bridge across the Danube in Budapest. This iconic suspension bridge connects Buda and Pest, symbolizing the unity of the city.',
        description: 'Historic suspension bridge connecting Buda and Pest',
        detailedDescription: 'The Széchenyi Chain Bridge is a suspension bridge that spans the River Danube between Buda and Pest, the western and eastern sides of Budapest, the capital of Hungary. Designed by English engineer William Tierney Clark and built by Scottish engineer Adam Clark, it was the first permanent bridge across the Danube in Budapest and was opened in 1849. The bridge is named after Count István Széchenyi, a major supporter of its construction. At the time of its construction, it was regarded as one of the modern world\'s engineering wonders. The bridge has a total length of 375 meters and a width of 14.8 meters. The two main supporting towers are 48 meters high and are built of stone. The bridge is decorated with stone lion sculptures at both ends. The Chain Bridge was destroyed during World War II and was rebuilt and reopened in 1949. It has become one of the most famous landmarks of Budapest.',
        historicalInfo: 'The Chain Bridge was built between 1839 and 1849, designed by William Tierney Clark and constructed by Adam Clark. It was the first permanent bridge to connect Buda and Pest. The bridge was destroyed during World War II and was rebuilt for its 100th anniversary in 1949.',
        yearBuilt: '1839-1849',
        architect: 'William Tierney Clark (design), Adam Clark (construction)'
      },
      ko: {
        name: '세체니 다리',
        narration: '부다페스트에서 도나우 강을 가로지르는 최초의 영구 다리인 세체니 다리에 오신 것을 환영합니다. 이 상징적인 현수교는 부다와 페스트를 연결하여 도시의 통합을 상징합니다.',
        description: '부다와 페스트를 연결하는 역사적인 현수교',
        detailedDescription: '세체니 다리는 헝가리 수도 부다페스트의 서쪽과 동쪽인 부다와 페스트 사이의 도나우 강을 가로지르는 현수교입니다. 영국 엔지니어 윌리엄 티어니 클라크가 설계하고 스코틀랜드 엔지니어 애덤 클라크가 건설했으며, 부다페스트에서 도나우 강을 가로지르는 최초의 영구 다리로 1849년에 개통되었습니다. 다리는 건설의 주요 후원자인 이슈트반 세체니 백작의 이름을 따서 명명되었습니다. 건설 당시 현대 세계의 공학적 경이로움 중 하나로 여겨졌습니다. 다리의 총 길이는 375미터이고 폭은 14.8미터입니다. 두 개의 주요 지지 탑은 높이가 48미터이며 돌로 만들어졌습니다. 다리는 양쪽 끝에 돌 사자 조각으로 장식되어 있습니다. 세체니 다리는 제2차 세계 대전 중에 파괴되었으며 1949년에 재건되어 재개통되었습니다. 부다페스트의 가장 유명한 랜드마크 중 하나가 되었습니다.',
        historicalInfo: '세체니 다리는 1839년부터 1849년 사이에 건설되었으며, 윌리엄 티어니 클라크가 설계하고 애덤 클라크가 건설했습니다. 부다와 페스트를 연결하는 최초의 영구 다리였습니다. 다리는 제2차 세계 대전 중에 파괴되었으며 1949년 100주년을 기념하여 재건되었습니다.',
        yearBuilt: '1839-1849년',
        architect: '윌리엄 티어니 클라크 (설계), 애덤 클라크 (건설)'
      },
      ja: {
        name: 'セーチェーニ鎖橋',
        narration: 'ブダペストでドナウ川を渡る最初の恒久的な橋であるセーチェーニ鎖橋へようこそ。この象徴的な吊り橋はブダとペストを結び、都市の統一を象徴しています。',
        description: 'ブダとペストを結ぶ歴史的な吊り橋',
        detailedDescription: 'セーチェーニ鎖橋は、ハンガリーの首都ブダペストの西側と東側であるブダとペストの間のドナウ川にかかる吊り橋です。イギリスのエンジニア、ウィリアム・ティアニー・クラークが設計し、スコットランドのエンジニア、アダム・クラークが建設しました。ブダペストでドナウ川を渡る最初の恒久的な橋であり、1849年に開通しました。橋は建設の主要な支援者であるイシュトヴァーン・セーチェーニ伯爵にちなんで名付けられました。建設当時、近代世界の工学的驚異の一つと見なされていました。橋の全長は375メートル、幅は14.8メートルです。2つの主要な支持塔は高さ48メートルで、石で造られています。橋は両端に石のライオン彫刻で飾られています。セーチェーニ鎖橋は第二次世界大戦中に破壊され、1949年に再建されて再開されました。ブダペストの最も有名なランドマークの一つになっています。',
        historicalInfo: 'セーチェーニ鎖橋は1839年から1849年の間に建設され、ウィリアム・ティアニー・クラークが設計し、アダム・クラークが建設しました。ブダとペストを結ぶ最初の恒久的な橋でした。橋は第二次世界大戦中に破壊され、1949年の100周年記念に再建されました。',
        yearBuilt: '1839-1849年',
        architect: 'ウィリアム・ティアニー・クラーク (設計)、アダム・クラーク (建設)'
      },
      zh: {
        name: '塞切尼链桥',
        narration: '欢迎来到塞切尼链桥,布达佩斯第一座横跨多瑙河的永久性桥梁。这座标志性的悬索桥连接布达和佩斯,象征着城市的统一。',
        description: '连接布达和佩斯的历史悬索桥',
        detailedDescription: '塞切尼链桥是横跨多瑙河、连接匈牙利首都布达佩斯西侧和东侧布达和佩斯的悬索桥。由英国工程师威廉·蒂尔尼·克拉克设计,苏格兰工程师亚当·克拉克建造,它是布达佩斯横跨多瑙河的第一座永久性桥梁,于1849年开通。该桥以其建设的主要支持者伊什特万·塞切尼伯爵的名字命名。在建造时,它被认为是现代世界的工程奇迹之一。大桥总长375米,宽14.8米。两座主要支撑塔高48米,由石头建造。大桥两端装饰有石狮雕塑。塞切尼链桥在第二次世界大战期间被摧毁,并于1949年重建和重新开放。它已成为布达佩斯最著名的地标之一。',
        historicalInfo: '塞切尼链桥建于1839年至1849年之间,由威廉·蒂尔尼·克拉克设计,亚当·克拉克建造。它是连接布达和佩斯的第一座永久性桥梁。该桥在第二次世界大战期间被摧毁,并于1949年为其100周年纪念而重建。',
        yearBuilt: '1839-1849年',
        architect: '威廉·蒂尔尼·克拉克 (设计), 亚当·克拉克 (建造)'
      }
    }
  },
  // Warsaw landmarks
  {
    id: 'warsaw_old_town',
    cityId: 'warsaw',
    name: 'Warsaw Old Town',
    lat: 52.249722,
    lng: 21.011944,
    radius: 100,
    narration: 'Welcome to Warsaw\'s Old Town, a UNESCO World Heritage Site that was meticulously reconstructed after World War II. This historic district showcases the resilience and spirit of the Polish people.',
    description: 'UNESCO World Heritage Site, meticulously reconstructed after WWII',
    category: 'Historic District',
    detailedDescription: 'Warsaw\'s Old Town is the oldest part of the capital city. It was established in the 13th century and was completely destroyed during the Warsaw Uprising in 1944. After World War II, the Old Town was meticulously reconstructed according to pre-war photographs and paintings, particularly those by 18th-century vedutist Bernardo Bellotto. The reconstruction was so thorough and authentic that UNESCO listed Warsaw\'s Old Town as a World Heritage Site in 1980, citing it as an outstanding example of a near-total reconstruction of a span of history covering the 13th to 20th century. The Old Town is centered on the Old Town Market Place (Rynek Starego Miasta), which teems with restaurants, cafés, and shops. Surrounding streets feature medieval architecture, the 17th-century Royal Castle, and numerous historical monuments. The area is a popular tourist destination and a symbol of Polish national identity and pride.',
    photos: [
      'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800',
      'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800',
      'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800'
    ],
    historicalInfo: 'Warsaw\'s Old Town was founded in the 13th century and grew over the centuries. It was completely destroyed during the Warsaw Uprising in 1944. The meticulous reconstruction after WWII, based on historical documents and paintings, is considered one of the greatest achievements of post-war reconstruction.',
    yearBuilt: '13th century (original), 1945-1966 (reconstruction)',
    architect: 'Various architects (original), Post-war reconstruction teams',
    translations: {
      en: {
        name: 'Warsaw Old Town',
        narration: 'Welcome to Warsaw\'s Old Town, a UNESCO World Heritage Site that was meticulously reconstructed after World War II. This historic district showcases the resilience and spirit of the Polish people.',
        description: 'UNESCO World Heritage Site, meticulously reconstructed after WWII',
        detailedDescription: 'Warsaw\'s Old Town is the oldest part of the capital city. It was established in the 13th century and was completely destroyed during the Warsaw Uprising in 1944. After World War II, the Old Town was meticulously reconstructed according to pre-war photographs and paintings, particularly those by 18th-century vedutist Bernardo Bellotto. The reconstruction was so thorough and authentic that UNESCO listed Warsaw\'s Old Town as a World Heritage Site in 1980, citing it as an outstanding example of a near-total reconstruction of a span of history covering the 13th to 20th century. The Old Town is centered on the Old Town Market Place (Rynek Starego Miasta), which teems with restaurants, cafés, and shops. Surrounding streets feature medieval architecture, the 17th-century Royal Castle, and numerous historical monuments. The area is a popular tourist destination and a symbol of Polish national identity and pride.',
        historicalInfo: 'Warsaw\'s Old Town was founded in the 13th century and grew over the centuries. It was completely destroyed during the Warsaw Uprising in 1944. The meticulous reconstruction after WWII, based on historical documents and paintings, is considered one of the greatest achievements of post-war reconstruction.',
        yearBuilt: '13th century (original), 1945-1966 (reconstruction)',
        architect: 'Various architects (original), Post-war reconstruction teams'
      },
      ko: {
        name: '바르샤바 구시가지',
        narration: '제2차 세계 대전 후 세심하게 재건된 유네스코 세계문화유산인 바르샤바 구시가지에 오신 것을 환영합니다. 이 역사적인 지구는 폴란드 국민의 회복력과 정신을 보여줍니다.',
        description: '유네스코 세계문화유산, 제2차 세계 대전 후 세심하게 재건',
        detailedDescription: '바르샤바 구시가지는 수도에서 가장 오래된 지역입니다. 13세기에 설립되었으며 1944년 바르샤바 봉기 중에 완전히 파괴되었습니다. 제2차 세계 대전 후 구시가지는 전쟁 전 사진과 그림, 특히 18세기 베두티스트 베르나르도 벨로토의 작품에 따라 세심하게 재건되었습니다. 재건이 너무나 철저하고 진정성 있게 이루어져 유네스코는 1980년 바르샤바 구시가지를 세계문화유산으로 지정했으며, 13세기부터 20세기까지의 역사를 거의 완전히 재건한 뛰어난 사례로 인용했습니다. 구시가지는 레스토랑, 카페, 상점으로 가득한 구시가지 시장 광장(리넥 스타레고 미아스타)을 중심으로 합니다. 주변 거리에는 중세 건축물, 17세기 왕궁, 수많은 역사적 기념물이 있습니다. 이 지역은 인기 있는 관광지이자 폴란드 국가 정체성과 자부심의 상징입니다.',
        historicalInfo: '바르샤바 구시가지는 13세기에 설립되어 수세기에 걸쳐 성장했습니다. 1944년 바르샤바 봉기 중에 완전히 파괴되었습니다. 역사적 문서와 그림을 기반으로 한 제2차 세계 대전 후의 세심한 재건은 전후 재건의 가장 위대한 업적 중 하나로 여겨집니다.',
        yearBuilt: '13세기 (원래), 1945-1966년 (재건)',
        architect: '다양한 건축가 (원래), 전후 재건 팀'
      },
      ja: {
        name: 'ワルシャワ旧市街',
        narration: '第二次世界大戦後に細心の注意を払って再建されたユネスコ世界遺産、ワルシャワ旧市街へようこそ。この歴史的地区はポーランド人の回復力と精神を示しています。',
        description: 'ユネスコ世界遺産、第二次世界大戦後に細心の注意を払って再建',
        detailedDescription: 'ワルシャワ旧市街は首都の最も古い部分です。13世紀に設立され、1944年のワルシャワ蜂起中に完全に破壊されました。第二次世界大戦後、旧市街は戦前の写真と絵画、特に18世紀のヴェドゥティスタ、ベルナルド・ベロットの作品に従って細心の注意を払って再建されました。再建が非常に徹底的で本格的であったため、ユネスコは1980年にワルシャワ旧市街を世界遺産に登録し、13世紀から20世紀にかけての歴史のほぼ完全な再建の優れた例として引用しました。旧市街は、レストラン、カフェ、ショップで賑わう旧市街市場広場(リネク・スタレゴ・ミアスタ)を中心としています。周辺の通りには中世の建築、17世紀の王宮、多数の歴史的記念碑があります。この地域は人気の観光地であり、ポーランドの国家的アイデンティティと誇りの象徴です。',
        historicalInfo: 'ワルシャワ旧市街は13世紀に設立され、何世紀にもわたって成長しました。1944年のワルシャワ蜂起中に完全に破壊されました。歴史的文書と絵画に基づく第二次世界大戦後の細心の再建は、戦後再建の最大の業績の一つと見なされています。',
        yearBuilt: '13世紀 (オリジナル)、1945-1966年 (再建)',
        architect: 'さまざまな建築家 (オリジナル)、戦後再建チーム'
      },
      zh: {
        name: '华沙老城',
        narration: '欢迎来到华沙老城,一个在第二次世界大战后精心重建的联合国教科文组织世界遗产。这个历史街区展示了波兰人民的韧性和精神。',
        description: '联合国教科文组织世界遗产,二战后精心重建',
        detailedDescription: '华沙老城是首都最古老的部分。它建立于13世纪,在1944年华沙起义期间被完全摧毁。第二次世界大战后,老城根据战前的照片和绘画,特别是18世纪风景画家贝尔纳多·贝洛托的作品,被精心重建。重建工作如此彻底和真实,以至于联合国教科文组织于1980年将华沙老城列为世界遗产,称其为13世纪至20世纪历史跨度近乎完全重建的杰出范例。老城以老城市场广场(Rynek Starego Miasta)为中心,那里到处都是餐馆、咖啡馆和商店。周围的街道有中世纪建筑、17世纪的皇家城堡和众多历史纪念碑。该地区是热门旅游目的地,也是波兰民族认同和自豪感的象征。',
        historicalInfo: '华沙老城建立于13世纪,并在几个世纪中成长。它在1944年华沙起义期间被完全摧毁。基于历史文献和绘画的二战后精心重建被认为是战后重建的最伟大成就之一。',
        yearBuilt: '13世纪 (原建筑), 1945-1966年 (重建)',
        architect: '各种建筑师 (原建筑), 战后重建团队'
      }
    }
  },
  {
    id: 'palace_of_culture',
    cityId: 'warsaw',
    name: 'Palace of Culture and Science',
    lat: 52.231667,
    lng: 21.005833,
    radius: 80,
    narration: 'Welcome to the Palace of Culture and Science, Warsaw\'s most iconic skyscraper. This towering structure is a symbol of the city and offers panoramic views from its observation deck.',
    description: 'Warsaw\'s iconic skyscraper and cultural center',
    category: 'Cultural Building',
    detailedDescription: 'The Palace of Culture and Science is a notable high-rise building in central Warsaw, Poland. With a total height of 237 meters, it is the second tallest building in both Warsaw and Poland, as well as one of the tallest in the European Union. Constructed in 1955, it was originally known as the Joseph Stalin Palace of Culture and Science, but in the process of de-Stalinization the dedication to Stalin was revoked. The building was a gift from the Soviet Union to the people of Poland and was erected in three years by 3,500 Soviet workers. The building is home to four theaters, a multiplex cinema, two museums, offices, bookshops, a large congress hall for up to 3,000 people, an accredited university, and the Polish Academy of Sciences. The 30th floor features an observation terrace from which visitors can see Warsaw\'s cityscape. The Palace is the venue for many events and exhibitions and has become one of Warsaw\'s most recognizable landmarks.',
    photos: [
      'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800',
      'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800',
      'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800'
    ],
    historicalInfo: 'The Palace of Culture and Science was built between 1952 and 1955 as a gift from Joseph Stalin to the Polish people. It was designed by Soviet architect Lev Rudnev in the Stalinist neoclassical style. The building has become a controversial symbol due to its association with Soviet dominance, but it remains an important cultural center.',
    yearBuilt: '1952-1955',
    architect: 'Lev Rudnev',
    translations: {
      en: {
        name: 'Palace of Culture and Science',
        narration: 'Welcome to the Palace of Culture and Science, Warsaw\'s most iconic skyscraper. This towering structure is a symbol of the city and offers panoramic views from its observation deck.',
        description: 'Warsaw\'s iconic skyscraper and cultural center',
        detailedDescription: 'The Palace of Culture and Science is a notable high-rise building in central Warsaw, Poland. With a total height of 237 meters, it is the second tallest building in both Warsaw and Poland, as well as one of the tallest in the European Union. Constructed in 1955, it was originally known as the Joseph Stalin Palace of Culture and Science, but in the process of de-Stalinization the dedication to Stalin was revoked. The building was a gift from the Soviet Union to the people of Poland and was erected in three years by 3,500 Soviet workers. The building is home to four theaters, a multiplex cinema, two museums, offices, bookshops, a large congress hall for up to 3,000 people, an accredited university, and the Polish Academy of Sciences. The 30th floor features an observation terrace from which visitors can see Warsaw\'s cityscape. The Palace is the venue for many events and exhibitions and has become one of Warsaw\'s most recognizable landmarks.',
        historicalInfo: 'The Palace of Culture and Science was built between 1952 and 1955 as a gift from Joseph Stalin to the Polish people. It was designed by Soviet architect Lev Rudnev in the Stalinist neoclassical style. The building has become a controversial symbol due to its association with Soviet dominance, but it remains an important cultural center.',
        yearBuilt: '1952-1955',
        architect: 'Lev Rudnev'
      },
      ko: {
        name: '문화과학궁전',
        narration: '바르샤바에서 가장 상징적인 고층 건물인 문화과학궁전에 오신 것을 환영합니다. 이 우뚝 솟은 건축물은 도시의 상징이며 전망대에서 파노라마 경치를 제공합니다.',
        description: '바르샤바의 상징적인 고층 건물 및 문화 센터',
        detailedDescription: '문화과학궁전은 폴란드 바르샤바 중심부에 있는 주목할 만한 고층 건물입니다. 총 높이 237미터로 바르샤바와 폴란드 모두에서 두 번째로 높은 건물이며 유럽 연합에서도 가장 높은 건물 중 하나입니다. 1955년에 건설되었으며 원래는 요제프 스탈린 문화과학궁전으로 알려졌지만 탈스탈린화 과정에서 스탈린에 대한 헌정이 철회되었습니다. 이 건물은 소련이 폴란드 국민에게 선물한 것으로 3,500명의 소련 노동자들이 3년 만에 건립했습니다. 건물에는 4개의 극장, 멀티플렉스 영화관, 2개의 박물관, 사무실, 서점, 최대 3,000명을 수용할 수 있는 대형 회의장, 인가된 대학교, 폴란드 과학 아카데미가 있습니다. 30층에는 방문객들이 바르샤바의 도시 풍경을 볼 수 있는 전망 테라스가 있습니다. 궁전은 많은 행사와 전시회의 장소이며 바르샤바에서 가장 잘 알려진 랜드마크 중 하나가 되었습니다.',
        historicalInfo: '문화과학궁전은 1952년부터 1955년까지 요제프 스탈린이 폴란드 국민에게 선물로 건설되었습니다. 소련 건축가 레프 루드네프가 스탈린 신고전주의 양식으로 설계했습니다. 이 건물은 소련의 지배와 관련되어 논란의 여지가 있는 상징이 되었지만 중요한 문화 센터로 남아 있습니다.',
        yearBuilt: '1952-1955년',
        architect: '레프 루드네프'
      },
      ja: {
        name: '文化科学宮殿',
        narration: 'ワルシャワで最も象徴的な超高層ビル、文化科学宮殿へようこそ。この聳え立つ構造物は市のシンボルであり、展望デッキからパノラマビューを提供します。',
        description: 'ワルシャワの象徴的な超高層ビルおよび文化センター',
        detailedDescription: '文化科学宮殿は、ポーランドのワルシャワ中心部にある注目すべき高層ビルです。総高237メートルで、ワルシャワとポーランドの両方で2番目に高い建物であり、欧州連合でも最も高い建物の一つです。1955年に建設され、当初はヨシフ・スターリン文化科学宮殿として知られていましたが、脱スターリン化の過程でスターリンへの献呈は取り消されました。この建物はソビエト連邦からポーランド国民への贈り物であり、3,500人のソビエト労働者によって3年間で建てられました。建物には4つの劇場、マルチプレックス映画館、2つの博物館、オフィス、書店、最大3,000人を収容できる大規模な会議場、認定大学、ポーランド科学アカデミーがあります。30階には展望テラスがあり、訪問者はワルシャワの街並みを見ることができます。宮殿は多くのイベントや展覧会の会場であり、ワルシャワで最も認識可能なランドマークの一つになっています。',
        historicalInfo: '文化科学宮殿は、ヨシフ・スターリンからポーランド国民への贈り物として1952年から1955年の間に建設されました。ソビエトの建築家レフ・ルドネフによってスターリン新古典主義様式で設計されました。この建物はソビエトの支配との関連から論争の的となるシンボルになっていますが、重要な文化センターのままです。',
        yearBuilt: '1952-1955年',
        architect: 'レフ・ルドネフ'
      },
      zh: {
        name: '文化科学宫',
        narration: '欢迎来到文化科学宫,华沙最具标志性的摩天大楼。这座高耸的建筑是城市的象征,从其观景台可以欣赏全景。',
        description: '华沙标志性摩天大楼和文化中心',
        detailedDescription: '文化科学宫是波兰华沙市中心的一座著名高层建筑。总高度为237米,是华沙和波兰第二高的建筑,也是欧盟最高的建筑之一。建于1955年,最初被称为约瑟夫·斯大林文化科学宫,但在去斯大林化过程中,对斯大林的题献被撤销。该建筑是苏联送给波兰人民的礼物,由3,500名苏联工人在三年内建成。该建筑拥有四个剧院、一个多厅电影院、两个博物馆、办公室、书店、可容纳多达3,000人的大型会议厅、一所认可的大学和波兰科学院。30楼设有观景台,游客可以从那里看到华沙的城市景观。该宫殿是许多活动和展览的场所,已成为华沙最知名的地标之一。',
        historicalInfo: '文化科学宫建于1952年至1955年之间,是约瑟夫·斯大林送给波兰人民的礼物。它由苏联建筑师列夫·鲁德涅夫以斯大林新古典主义风格设计。由于与苏联统治的联系,该建筑已成为一个有争议的象征,但它仍然是一个重要的文化中心。',
        yearBuilt: '1952-1955年',
        architect: '列夫·鲁德涅夫'
      }
    }
  },
  // Stockholm landmarks
  {
    id: 'vasa_museum',
    cityId: 'stockholm',
    name: 'Vasa Museum',
    lat: 59.327939,
    lng: 18.091573,
    radius: 60,
    narration: 'Welcome to the Vasa Museum, home to the only preserved 17th-century ship in the world. This magnificent warship sank on its maiden voyage in 1628 and was salvaged 333 years later.',
    description: 'Home to the only preserved 17th-century ship in the world',
    category: 'Maritime Museum',
    detailedDescription: 'The Vasa Museum is Sweden\'s most visited museum and houses the world\'s only preserved 17th-century warship. The 64-gun warship Vasa sank on its maiden voyage in Stockholm harbor in 1628, less than a nautical mile into its journey. After 333 years on the seabed, the ship was salvaged in 1961 with thousands of artifacts. The museum, which opened in 1990, displays the ship and over 14,000 wooden objects, 700 sculptures, textiles, coins, and skeletons. The Vasa is one of Sweden\'s most popular tourist attractions and has been seen by over 35 million visitors. The ship is 69 meters long and 48 meters tall, making it an awe-inspiring sight. The museum tells the story of the ship\'s construction, sinking, and recovery, as well as life aboard a 17th-century warship.',
    photos: [
      'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800',
      'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800',
      'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800'
    ],
    historicalInfo: 'The Vasa was built from 1626 to 1628 and was one of the most powerful warships ever built. It sank after sailing just 1,300 meters on its maiden voyage on August 10, 1628. The ship was rediscovered in 1956 and salvaged on April 24, 1961, remarkably well preserved in the cold, brackish waters of Stockholm harbor.',
    yearBuilt: '1626-1628',
    architect: 'Henrik Hybertsson',
    translations: {
      en: {
        name: 'Vasa Museum',
        narration: 'Welcome to the Vasa Museum, home to the only preserved 17th-century ship in the world. This magnificent warship sank on its maiden voyage in 1628 and was salvaged 333 years later.',
        description: 'Home to the only preserved 17th-century ship in the world',
        detailedDescription: 'The Vasa Museum is Sweden\'s most visited museum and houses the world\'s only preserved 17th-century warship. The 64-gun warship Vasa sank on its maiden voyage in Stockholm harbor in 1628, less than a nautical mile into its journey. After 333 years on the seabed, the ship was salvaged in 1961 with thousands of artifacts. The museum, which opened in 1990, displays the ship and over 14,000 wooden objects, 700 sculptures, textiles, coins, and skeletons. The Vasa is one of Sweden\'s most popular tourist attractions and has been seen by over 35 million visitors. The ship is 69 meters long and 48 meters tall, making it an awe-inspiring sight. The museum tells the story of the ship\'s construction, sinking, and recovery, as well as life aboard a 17th-century warship.',
        historicalInfo: 'The Vasa was built from 1626 to 1628 and was one of the most powerful warships ever built. It sank after sailing just 1,300 meters on its maiden voyage on August 10, 1628. The ship was rediscovered in 1956 and salvaged on April 24, 1961, remarkably well preserved in the cold, brackish waters of Stockholm harbor.',
        yearBuilt: '1626-1628',
        architect: 'Henrik Hybertsson'
      },
      ko: {
        name: '바사 박물관',
        narration: '세계에서 유일하게 보존된 17세기 선박이 있는 바사 박물관에 오신 것을 환영합니다. 이 장엄한 군함은 1628년 첫 항해에서 침몰했고 333년 후에 인양되었습니다.',
        description: '세계 유일의 보존된 17세기 선박이 있는 곳',
        detailedDescription: '바사 박물관은 스웨덴에서 가장 많은 방문객이 찾는 박물관이며 세계에서 유일하게 보존된 17세기 군함을 소장하고 있습니다. 64문의 대포를 장착한 군함 바사는 1628년 스톡홀름 항구에서 첫 항해 중 1해리도 채 가지 못하고 침몰했습니다. 333년 동안 해저에 있다가 1961년 수천 개의 유물과 함께 인양되었습니다. 1990년에 개관한 박물관은 선박과 14,000개 이상의 목재 물품, 700개의 조각품, 직물, 동전, 해골을 전시하고 있습니다. 바사는 스웨덴에서 가장 인기 있는 관광 명소 중 하나로 3,500만 명 이상의 방문객이 다녀갔습니다. 선박은 길이 69미터, 높이 48미터로 경외감을 불러일으키는 광경입니다. 박물관은 선박의 건조, 침몰, 회수 이야기와 17세기 군함에서의 생활을 보여줍니다.',
        historicalInfo: '바사는 1626년부터 1628년까지 건조되었으며 역사상 가장 강력한 군함 중 하나였습니다. 1628년 8월 10일 첫 항해에서 1,300미터만 항해한 후 침몰했습니다. 선박은 1956년에 재발견되었고 1961년 4월 24일에 인양되었으며, 스톡홀름 항구의 차갑고 기수성인 물에서 놀라울 정도로 잘 보존되어 있었습니다.',
        yearBuilt: '1626-1628년',
        architect: '헨리크 히베르트손'
      },
      ja: {
        name: 'ヴァーサ号博物館',
        narration: '世界で唯一保存されている17世紀の船があるヴァーサ号博物館へようこそ。この壮大な軍艦は1628年の処女航海で沈没し、333年後に引き揚げられました。',
        description: '世界で唯一保存されている17世紀の船がある場所',
        detailedDescription: 'ヴァーサ号博物館はスウェーデンで最も訪問者の多い博物館であり、世界で唯一保存されている17世紀の軍艦を収蔵しています。64門の大砲を装備した軍艦ヴァーサ号は、1628年にストックホルム港での処女航海中、1海里も進まないうちに沈没しました。333年間海底にあった後、1961年に数千点の遺物とともに引き揚げられました。1990年に開館した博物館には、船と14,000点以上の木製品、700点の彫刻、織物、硬貨、骸骨が展示されています。ヴァーサ号はスウェーデンで最も人気のある観光名所の一つであり、3,500万人以上の訪問者が訪れています。船は長さ69メートル、高さ48メートルで、畏敬の念を起こさせる光景です。博物館は、船の建造、沈没、回収の物語と、17世紀の軍艦での生活を伝えています。',
        historicalInfo: 'ヴァーサ号は1626年から1628年にかけて建造され、これまでで最も強力な軍艦の一つでした。1628年8月10日の処女航海で1,300メートルしか航海せずに沈没しました。船は1956年に再発見され、1961年4月24日に引き揚げられ、ストックホルム港の冷たい汽水域で驚くほど良好な状態で保存されていました。',
        yearBuilt: '1626-1628年',
        architect: 'ヘンリク・ヒュベルトソン'
      },
      zh: {
        name: '瓦萨博物馆',
        narration: '欢迎来到瓦萨博物馆，这里是世界上唯一保存完好的17世纪船只的所在地。这艘宏伟的战舰在1628年的处女航中沉没，333年后被打捞上来。',
        description: '世界上唯一保存完好的17世纪船只的所在地',
        detailedDescription: '瓦萨博物馆是瑞典访问量最大的博物馆，收藏着世界上唯一保存完好的17世纪战舰。这艘装备64门大炮的战舰瓦萨号在1628年的斯德哥尔摩港处女航中沉没，航程不到1海里。在海底沉睡333年后，该船于1961年与数千件文物一起被打捞上来。博物馆于1990年开放，展示了这艘船以及14,000多件木制物品、700件雕塑、纺织品、硬币和骸骨。瓦萨号是瑞典最受欢迎的旅游景点之一，已有超过3,500万游客参观。这艘船长69米，高48米，令人叹为观止。博物馆讲述了船只建造、沉没和打捞的故事，以及17世纪战舰上的生活。',
        historicalInfo: '瓦萨号建于1626年至1628年，是有史以来最强大的战舰之一。它在1628年8月10日的处女航中仅航行了1,300米后就沉没了。该船于1956年被重新发现，并于1961年4月24日被打捞上来，在斯德哥尔摩港冰冷的半咸水中保存得非常完好。',
        yearBuilt: '1626-1628年',
        architect: '亨里克·海贝特松'
      }
    }
  },
  {
    id: 'gamla_stan',
    cityId: 'stockholm',
    name: 'Gamla Stan',
    lat: 59.325,
    lng: 18.070833,
    radius: 80,
    narration: 'Welcome to Gamla Stan, Stockholm\'s Old Town. This charming medieval city center dates back to the 13th century and is one of Europe\'s best-preserved medieval city centers.',
    description: 'Stockholm\'s charming medieval Old Town',
    category: 'Historic District',
    detailedDescription: 'Gamla Stan, Stockholm\'s Old Town, is one of the largest and best-preserved medieval city centers in Europe. Dating from the 13th century, this historic neighborhood sits on Stadsholmen island and is characterized by its narrow cobblestone streets, colorful 17th and 18th-century buildings, and authentic medieval architecture. The area is home to the Royal Palace, one of the largest palaces in Europe with over 600 rooms, Stockholm Cathedral, the Nobel Museum, and numerous restaurants, cafés, and shops selling everything from Swedish souvenirs to antiques. Stortorget, the oldest square in Stockholm, is the heart of Gamla Stan and was the site of the Stockholm Bloodbath in 1520. The narrow alley Mårten Trotzigs gränd, only 90 centimeters wide at its narrowest point, is a popular photo spot. Walking through Gamla Stan is like stepping back in time, with medieval cellars now housing atmospheric restaurants and the old merchants\' houses painted in traditional ochre colors creating a fairytale-like atmosphere.',
    photos: [
      'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800',
      'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800',
      'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800'
    ],
    historicalInfo: 'Gamla Stan was established in the 13th century and served as the heart of Stockholm. The area preserved its medieval street layout, though most buildings date from the 17th and 18th centuries when they were rebuilt after fires. The Royal Palace was built in the 18th century after the old Tre Kronor castle burned down in 1697.',
    yearBuilt: '13th century',
    architect: 'Various medieval and baroque architects',
    translations: {
      en: {
        name: 'Gamla Stan',
        narration: 'Welcome to Gamla Stan, Stockholm\'s Old Town. This charming medieval city center dates back to the 13th century and is one of Europe\'s best-preserved medieval city centers.',
        description: 'Stockholm\'s charming medieval Old Town',
        detailedDescription: 'Gamla Stan, Stockholm\'s Old Town, is one of the largest and best-preserved medieval city centers in Europe. Dating from the 13th century, this historic neighborhood sits on Stadsholmen island and is characterized by its narrow cobblestone streets, colorful 17th and 18th-century buildings, and authentic medieval architecture. The area is home to the Royal Palace, one of the largest palaces in Europe with over 600 rooms, Stockholm Cathedral, the Nobel Museum, and numerous restaurants, cafés, and shops selling everything from Swedish souvenirs to antiques. Stortorget, the oldest square in Stockholm, is the heart of Gamla Stan and was the site of the Stockholm Bloodbath in 1520. The narrow alley Mårten Trotzigs gränd, only 90 centimeters wide at its narrowest point, is a popular photo spot. Walking through Gamla Stan is like stepping back in time, with medieval cellars now housing atmospheric restaurants and the old merchants\' houses painted in traditional ochre colors creating a fairytale-like atmosphere.',
        historicalInfo: 'Gamla Stan was established in the 13th century and served as the heart of Stockholm. The area preserved its medieval street layout, though most buildings date from the 17th and 18th centuries when they were rebuilt after fires. The Royal Palace was built in the 18th century after the old Tre Kronor castle burned down in 1697.',
        yearBuilt: '13th century',
        architect: 'Various medieval and baroque architects'
      },
      ko: {
        name: '감라 스탄',
        narration: '스톡홀름의 구시가지 감라 스탄에 오신 것을 환영합니다. 이 매력적인 중세 도심은 13세기로 거슬러 올라가며 유럽에서 가장 잘 보존된 중세 도심 중 하나입니다.',
        description: '스톡홀름의 매력적인 중세 구시가지',
        detailedDescription: '스톡홀름의 구시가지인 감라 스탄은 유럽에서 가장 크고 잘 보존된 중세 도심 중 하나입니다. 13세기로 거슬러 올라가는 이 역사적인 지역은 스타드쉬올멘 섬에 위치하며 좁은 자갈길, 다채로운 17-18세기 건물, 진정한 중세 건축물이 특징입니다. 이 지역에는 600개 이상의 방을 갖춘 유럽 최대의 궁전 중 하나인 왕궁, 스톡홀름 대성당, 노벨 박물관, 그리고 스웨덴 기념품부터 골동품까지 판매하는 수많은 레스토랑, 카페, 상점이 있습니다. 스톡홀름에서 가장 오래된 광장인 스토르토르예트는 감라 스탄의 중심이며 1520년 스톡홀름 대학살의 현장이었습니다. 가장 좁은 지점이 90센티미터인 좁은 골목 모르텐 트로치그스 그렌드는 인기 있는 사진 촬영 장소입니다. 감라 스탄을 걷는 것은 시간을 거슬러 올라가는 것과 같으며, 중세 지하실은 현재 분위기 있는 레스토랑으로 사용되고 전통적인 황토색으로 칠해진 옛 상인의 집들은 동화 같은 분위기를 연출합니다.',
        historicalInfo: '감라 스탄은 13세기에 설립되어 스톡홀름의 중심지 역할을 했습니다. 이 지역은 중세 거리 배치를 보존했지만 대부분의 건물은 화재 후 재건된 17-18세기에 지어졌습니다. 왕궁은 1697년 트레 크로노르 성이 불타버린 후 18세기에 지어졌습니다.',
        yearBuilt: '13세기',
        architect: '다양한 중세 및 바로크 건축가'
      },
      ja: {
        name: 'ガムラスタン',
        narration: 'ストックホルムの旧市街、ガムラスタンへようこそ。この魅力的な中世の都心は13世紀にさかのぼり、ヨーロッパで最も保存状態の良い中世都市の中心地の一つです。',
        description: 'ストックホルムの魅力的な中世の旧市街',
        detailedDescription: 'ストックホルムの旧市街であるガムラスタンは、ヨーロッパで最大かつ最も保存状態の良い中世都市の中心地の一つです。13世紀にさかのぼるこの歴史的な地区はスタッズホルメン島に位置し、狭い石畳の通り、カラフルな17-18世紀の建物、本格的な中世建築が特徴です。この地域には、600以上の部屋を持つヨーロッパ最大の宮殿の一つである王宮、ストックホルム大聖堂、ノーベル博物館、そしてスウェーデンの土産物から骨董品まで販売する多くのレストラン、カフェ、ショップがあります。ストックホルムで最も古い広場であるストートリエットはガムラスタンの中心であり、1520年のストックホルム大虐殺の現場でした。最も狭い地点で90センチメートルしかない狭い路地、モーテン・トロツィグス・グレンドは人気の写真スポットです。ガムラスタンを歩くことは時間を遡るようなもので、中世の地下室は現在雰囲気のあるレストランになっており、伝統的な黄土色に塗られた古い商人の家々がおとぎ話のような雰囲気を作り出しています。',
        historicalInfo: 'ガムラスタンは13世紀に設立され、ストックホルムの中心地として機能しました。この地域は中世の街路配置を保存していますが、ほとんどの建物は火災後に再建された17-18世紀のものです。王宮は、1697年に古いトレ・クロノール城が焼失した後、18世紀に建てられました。',
        yearBuilt: '13世紀',
        architect: '様々な中世およびバロック建築家'
      },
      zh: {
        name: '老城区',
        narration: '欢迎来到斯德哥尔摩的老城区感拉斯坦。这个迷人的中世纪市中心可追溯到13世纪，是欧洲保存最完好的中世纪市中心之一。',
        description: '斯德哥尔摩迷人的中世纪老城',
        detailedDescription: '斯德哥尔摩的老城区感拉斯坦是欧洲最大、保存最完好的中世纪市中心之一。这个历史悠久的街区可追溯到13世纪，位于斯塔德霍尔门岛上，以其狭窄的鹅卵石街道、色彩缤纷的17-18世纪建筑和真正的中世纪建筑为特色。该地区拥有欧洲最大的宫殿之一——拥有600多个房间的王宫、斯德哥尔摩大教堂、诺贝尔博物馆，以及众多出售从瑞典纪念品到古董的餐厅、咖啡馆和商店。斯托托尔耶特是斯德哥尔摩最古老的广场，是感拉斯坦的中心，也是1520年斯德哥尔摩大屠杀的发生地。最窄处仅90厘米的狭窄小巷莫滕·特罗齐格斯格兰德是热门的拍照地点。漫步感拉斯坦就像回到过去，中世纪的地窖现在变成了氛围浓厚的餐厅，涂有传统赭石色的老商人房屋营造出童话般的氛围。',
        historicalInfo: '感拉斯坦建于13世纪，曾是斯德哥尔摩的中心。该地区保留了中世纪的街道布局，但大多数建筑可追溯到火灾后重建的17-18世纪。王宫建于18世纪，是在1697年旧的特雷克鲁诺尔城堡被烧毁后建造的。',
        yearBuilt: '13世纪',
        architect: '各种中世纪和巴洛克建筑师'
      }
    }
  },
  // Copenhagen landmarks
  {
    id: 'little_mermaid',
    cityId: 'copenhagen',
    name: 'The Little Mermaid',
    lat: 55.692871,
    lng: 12.599291,
    radius: 50,
    narration: 'Welcome to The Little Mermaid, Copenhagen\'s iconic bronze statue. Based on Hans Christian Andersen\'s fairy tale, this beloved sculpture has been greeting visitors since 1913.',
    description: 'Copenhagen\'s iconic bronze mermaid statue',
    category: 'Monument',
    detailedDescription: 'The Little Mermaid statue is one of Copenhagen\'s most famous landmarks and has become a symbol of Denmark itself. The bronze and granite statue sits on a rock by the waterside at Langelinie promenade and depicts a mermaid becoming human. Inspired by Hans Christian Andersen\'s fairy tale of the same name, the statue was commissioned in 1909 by Carl Jacobsen, son of the founder of Carlsberg, who was fascinated by a ballet performance based on the story. Sculptor Edvard Eriksen created the statue using his wife Eline as the model for the body and the face of ballerina Ellen Price as the model for the head. The statue measures 1.25 meters in height and weighs about 175 kilograms. Despite its modest size, it has become one of the world\'s most photographed statues. The statue has had an eventful history, suffering several acts of vandalism including decapitation and paint attacks, but has always been restored to its original glory.',
    photos: [
      'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800',
      'https://images.unsplash.com/photo-1552560880-2482cef14240?w=800',
      'https://images.unsplash.com/photo-1533582064595-1b6f8c0a8e92?w=800'
    ],
    historicalInfo: 'The Little Mermaid statue was unveiled on August 23, 1913. It was commissioned by Carl Jacobsen, the son of the founder of Carlsberg brewery, after he was captivated by a ballet performance of Hans Christian Andersen\'s fairy tale at the Royal Danish Theatre.',
    yearBuilt: '1913',
    architect: 'Edvard Eriksen',
    translations: {
      en: {
        name: 'The Little Mermaid',
        narration: 'Welcome to The Little Mermaid, Copenhagen\'s iconic bronze statue. Based on Hans Christian Andersen\'s fairy tale, this beloved sculpture has been greeting visitors since 1913.',
        description: 'Copenhagen\'s iconic bronze mermaid statue',
        detailedDescription: 'The Little Mermaid statue is one of Copenhagen\'s most famous landmarks and has become a symbol of Denmark itself. The bronze and granite statue sits on a rock by the waterside at Langelinie promenade and depicts a mermaid becoming human. Inspired by Hans Christian Andersen\'s fairy tale of the same name, the statue was commissioned in 1909 by Carl Jacobsen, son of the founder of Carlsberg, who was fascinated by a ballet performance based on the story. Sculptor Edvard Eriksen created the statue using his wife Eline as the model for the body and the face of ballerina Ellen Price as the model for the head. The statue measures 1.25 meters in height and weighs about 175 kilograms. Despite its modest size, it has become one of the world\'s most photographed statues. The statue has had an eventful history, suffering several acts of vandalism including decapitation and paint attacks, but has always been restored to its original glory.',
        historicalInfo: 'The Little Mermaid statue was unveiled on August 23, 1913. It was commissioned by Carl Jacobsen, the son of the founder of Carlsberg brewery, after he was captivated by a ballet performance of Hans Christian Andersen\'s fairy tale at the Royal Danish Theatre.',
        yearBuilt: '1913',
        architect: 'Edvard Eriksen'
      },
      ko: {
        name: '인어공주상',
        narration: '코펜하겐의 상징적인 청동상 인어공주에 오신 것을 환영합니다. 한스 크리스티안 안데르센의 동화를 바탕으로 한 이 사랑받는 조각상은 1913년부터 방문객들을 맞이하고 있습니다.',
        description: '코펜하겐의 상징적인 청동 인어공주상',
        detailedDescription: '인어공주상은 코펜하겐에서 가장 유명한 랜드마크 중 하나이며 덴마크 자체의 상징이 되었습니다. 청동과 화강암 조각상은 랑겔리니에 산책로의 수변 바위 위에 앉아 있으며 인어가 인간이 되는 모습을 묘사합니다. 같은 이름의 한스 크리스티안 안데르센 동화에서 영감을 받아 이 조각상은 1909년 칼스버그 창립자의 아들 칼 야콥센이 이야기를 바탕으로 한 발레 공연에 매료되어 의뢰했습니다. 조각가 에드바르 에릭센은 아내 엘리네를 몸의 모델로, 발레리나 엘렌 프라이스의 얼굴을 머리의 모델로 사용하여 조각상을 만들었습니다. 조각상의 높이는 1.25미터이며 무게는 약 175킬로그램입니다. 크기는 작지만 세계에서 가장 많이 촬영된 조각상 중 하나가 되었습니다. 조각상은 참수와 페인트 공격을 포함한 여러 파손 행위를 겪었지만 항상 원래의 영광으로 복원되었습니다.',
        historicalInfo: '인어공주상은 1913년 8월 23일에 공개되었습니다. 칼스버그 양조장 창립자의 아들 칼 야콥센이 덴마크 왕립극장에서 한스 크리스티안 안데르센의 동화 발레 공연에 매료된 후 의뢰했습니다.',
        yearBuilt: '1913년',
        architect: '에드바르 에릭센'
      },
      ja: {
        name: '人魚姫の像',
        narration: 'コペンハーゲンの象徴的なブロンズ像、人魚姫へようこそ。ハンス・クリスチャン・アンデルセンの童話に基づくこの愛される彫刻は、1913年以来訪問者を迎えています。',
        description: 'コペンハーゲンの象徴的なブロンズ人魚像',
        detailedDescription: '人魚姫の像はコペンハーゲンで最も有名なランドマークの一つであり、デンマーク自体の象徴となっています。ブロンズと花崗岩の像はランゲリニエ遊歩道の水辺の岩の上に座り、人魚が人間になる様子を描いています。同名のハンス・クリスチャン・アンデルセンの童話に触発され、この像は1909年にカールスバーグの創業者の息子カール・ヤコブセンによって委託されました。彼は物語に基づくバレエ公演に魅了されました。彫刻家エドヴァルド・エリクセンは、妻エリーネを体のモデルとし、バレリーナのエレン・プライスの顔を頭のモデルとして使用して像を作成しました。像の高さは1.25メートル、重さは約175キログラムです。控えめなサイズにもかかわらず、世界で最も撮影された像の一つになっています。像は斬首やペンキ攻撃を含むいくつかの破壊行為を受けましたが、常に元の栄光に復元されています。',
        historicalInfo: '人魚姫の像は1913年8月23日に除幕されました。カールスバーグ醸造所の創業者の息子カール・ヤコブセンが、デンマーク王立劇場でハンス・クリスチャン・アンデルセンの童話のバレエ公演に魅了された後に委託しました。',
        yearBuilt: '1913年',
        architect: 'エドヴァルド・エリクセン'
      },
      zh: {
        name: '小美人鱼雕像',
        narration: '欢迎来到小美人鱼，哥本哈根的标志性青铜雕像。这座深受喜爱的雕塑以汉斯·克里斯蒂安·安徒生的童话为基础，自1913年以来一直迎接着游客。',
        description: '哥本哈根的标志性青铜美人鱼雕像',
        detailedDescription: '小美人鱼雕像是哥本哈根最著名的地标之一，已成为丹麦本身的象征。这座青铜和花岗岩雕像坐在朗厄里尼海滨长廊的水边岩石上，描绘了美人鱼变成人类的场景。受同名汉斯·克里斯蒂安·安徒生童话的启发，这座雕像由嘉士伯啤酒创始人的儿子卡尔·雅各布森于1909年委托制作，他被基于这个故事的芭蕾舞表演所吸引。雕塑家爱德华·埃里克森以他的妻子埃琳作为身体模特，以芭蕾舞演员艾伦·普赖斯的脸作为头部模特创作了这座雕像。雕像高1.25米，重约175公斤。尽管尺寸不大，它已成为世界上拍摄最多的雕像之一。雕像经历了多次破坏行为，包括斩首和油漆攻击，但总是被修复到原来的辉煌。',
        historicalInfo: '小美人鱼雕像于1913年8月23日揭幕。它是由嘉士伯啤酒厂创始人的儿子卡尔·雅各布森委托制作的，他在丹麦皇家剧院观看了汉斯·克里斯蒂安·安徒生童话的芭蕾舞表演后深受吸引。',
        yearBuilt: '1913年',
        architect: '爱德华·埃里克森'
      }
    }
  },
  {
    id: 'nyhavn',
    cityId: 'copenhagen',
    name: 'Nyhavn',
    lat: 55.680087,
    lng: 12.590611,
    radius: 70,
    narration: 'Welcome to Nyhavn, Copenhagen\'s picturesque waterfront district. This 17th-century harbor is famous for its colorful townhouses, historic wooden ships, and lively atmosphere.',
    description: 'Copenhagen\'s colorful 17th-century waterfront district',
    category: 'Historic District',
    detailedDescription: 'Nyhavn, meaning "New Harbor," is a 17th-century waterfront, canal, and entertainment district in Copenhagen. Stretching from Kongens Nytorv to the harbor front, this iconic canal is lined with brightly colored 17th and 18th-century townhouses, bars, cafés, and restaurants. The north side of Nyhavn is particularly famous for its vibrant facades in shades of yellow, red, blue, and orange. Historically a busy commercial port where ships from around the world docked, Nyhavn is now a popular spot for both tourists and locals. The famous fairy tale author Hans Christian Andersen lived at Nyhavn for almost 20 years in three different houses: numbers 20, 67, and 18. He wrote his first fairy tales while living at number 20. The canal is home to many historic wooden ships, some of which are museum ships that offer tours. During summer, Nyhavn becomes especially lively with outdoor seating at restaurants and cafés, street performers, and boats offering canal tours. The atmosphere transforms in winter when the area hosts a charming Christmas market.',
    photos: [
      'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800',
      'https://images.unsplash.com/photo-1552560880-2482cef14240?w=800',
      'https://images.unsplash.com/photo-1533582064595-1b6f8c0a8e92?w=800'
    ],
    historicalInfo: 'Nyhavn was constructed by King Christian V from 1670 to 1673, dug by Swedish prisoners of war. It was a gateway from the sea to the old inner city, allowing merchants to bring their goods directly to Kongens Nytorv square. The area was long known for its rowdy bars and brothels, but has been gentrified into a popular tourist attraction.',
    yearBuilt: '1670-1673',
    architect: 'King Christian V',
    translations: {
      en: {
        name: 'Nyhavn',
        narration: 'Welcome to Nyhavn, Copenhagen\'s picturesque waterfront district. This 17th-century harbor is famous for its colorful townhouses, historic wooden ships, and lively atmosphere.',
        description: 'Copenhagen\'s colorful 17th-century waterfront district',
        detailedDescription: 'Nyhavn, meaning "New Harbor," is a 17th-century waterfront, canal, and entertainment district in Copenhagen. Stretching from Kongens Nytorv to the harbor front, this iconic canal is lined with brightly colored 17th and 18th-century townhouses, bars, cafés, and restaurants. The north side of Nyhavn is particularly famous for its vibrant facades in shades of yellow, red, blue, and orange. Historically a busy commercial port where ships from around the world docked, Nyhavn is now a popular spot for both tourists and locals. The famous fairy tale author Hans Christian Andersen lived at Nyhavn for almost 20 years in three different houses: numbers 20, 67, and 18. He wrote his first fairy tales while living at number 20. The canal is home to many historic wooden ships, some of which are museum ships that offer tours. During summer, Nyhavn becomes especially lively with outdoor seating at restaurants and cafés, street performers, and boats offering canal tours. The atmosphere transforms in winter when the area hosts a charming Christmas market.',
        historicalInfo: 'Nyhavn was constructed by King Christian V from 1670 to 1673, dug by Swedish prisoners of war. It was a gateway from the sea to the old inner city, allowing merchants to bring their goods directly to Kongens Nytorv square. The area was long known for its rowdy bars and brothels, but has been gentrified into a popular tourist attraction.',
        yearBuilt: '1670-1673',
        architect: 'King Christian V'
      },
      ko: {
        name: '뉘하운',
        narration: '코펜하겐의 그림 같은 수변 지역 뉘하운에 오신 것을 환영합니다. 이 17세기 항구는 화려한 타운하우스, 역사적인 목조 선박, 활기찬 분위기로 유명합니다.',
        description: '코펜하겐의 다채로운 17세기 수변 지구',
        detailedDescription: '"새로운 항구"를 의미하는 뉘하운은 코펜하겐의 17세기 수변, 운하, 오락 지구입니다. 콩엔스 뉘토르브에서 항구 정면까지 뻗어 있는 이 상징적인 운하는 밝은 색상의 17-18세기 타운하우스, 바, 카페, 레스토랑이 늘어서 있습니다. 뉘하운의 북쪽은 노란색, 빨간색, 파란색, 주황색의 생동감 있는 파사드로 특히 유명합니다. 역사적으로 전 세계의 선박이 정박하는 번잡한 상업 항구였던 뉘하운은 현재 관광객과 현지인 모두에게 인기 있는 장소입니다. 유명한 동화 작가 한스 크리스티안 안데르센은 뉘하운의 세 개의 다른 집(20번, 67번, 18번)에서 거의 20년을 살았습니다. 그는 20번지에 살면서 첫 동화를 썼습니다. 운하에는 많은 역사적인 목조 선박이 있으며, 그 중 일부는 투어를 제공하는 박물관 선박입니다. 여름 동안 뉘하운은 레스토랑과 카페의 야외 좌석, 거리 공연자, 운하 투어를 제공하는 보트로 특히 활기차게 됩니다. 이 지역이 매력적인 크리스마스 시장을 개최하는 겨울에는 분위기가 변합니다.',
        historicalInfo: '뉘하운은 1670년부터 1673년까지 크리스티안 5세 왕이 건설했으며 스웨덴 전쟁 포로들이 굴착했습니다. 바다에서 구도심으로 가는 관문으로 상인들이 물품을 콩엔스 뉘토르브 광장으로 직접 가져올 수 있게 했습니다. 이 지역은 오랫동안 시끄러운 술집과 매춘 업소로 알려졌지만 인기 있는 관광 명소로 변모했습니다.',
        yearBuilt: '1670-1673년',
        architect: '크리스티안 5세 왕'
      },
      ja: {
        name: 'ニューハウン',
        narration: 'コペンハーゲンの絵のような水辺地区、ニューハウンへようこそ。この17世紀の港は、カラフルなタウンハウス、歴史的な木造船、活気ある雰囲気で有名です。',
        description: 'コペンハーゲンのカラフルな17世紀の水辺地区',
        detailedDescription: '「新しい港」を意味するニューハウンは、コペンハーゲンの17世紀の水辺、運河、娯楽地区です。コンゲンス・ニュートーから港の正面まで伸びるこの象徴的な運河は、明るい色の17-18世紀のタウンハウス、バー、カフェ、レストランが立ち並んでいます。ニューハウンの北側は、黄色、赤、青、オレンジの鮮やかなファサードで特に有名です。歴史的に世界中の船が停泊する忙しい商業港であったニューハウンは、現在観光客と地元の人々の両方に人気のスポットです。有名な童話作家ハンス・クリスチャン・アンデルセンは、20番、67番、18番の3つの異なる家でニューハウンに約20年間住んでいました。彼は20番地に住んでいる間に最初の童話を書きました。運河には多くの歴史的な木造船があり、そのいくつかはツアーを提供する博物館船です。夏の間、ニューハウンはレストランやカフェの屋外席、ストリートパフォーマー、運河ツアーを提供するボートで特に賑やかになります。冬になると、この地域が魅力的なクリスマスマーケットを開催し、雰囲気が変わります。',
        historicalInfo: 'ニューハウンは1670年から1673年にかけてクリスチャン5世王によって建設され、スウェーデンの戦争捕虜によって掘削されました。海から旧内市への玄関口であり、商人が商品をコンゲンス・ニュートー広場に直接持ち込むことができました。この地域は長い間騒がしいバーや売春宿で知られていましたが、人気の観光名所に変貌しました。',
        yearBuilt: '1670-1673年',
        architect: 'クリスチャン5世王'
      },
      zh: {
        name: '新港',
        narration: '欢迎来到新港，哥本哈根风景如画的海滨区。这个17世纪的港口以其色彩缤纷的联排别墅、历史悠久的木船和热闹的氛围而闻名。',
        description: '哥本哈根色彩缤纷的17世纪海滨区',
        detailedDescription: '新港意为"新港口"，是哥本哈根的一个17世纪海滨、运河和娱乐区。从国王新广场一直延伸到港口前沿，这条标志性运河两旁排列着色彩鲜艳的17和18世纪联排别墅、酒吧、咖啡馆和餐厅。新港北侧以其黄色、红色、蓝色和橙色的鲜艳立面而闻名。历史上曾是世界各地船只停靠的繁忙商业港口，新港现在是游客和当地人都喜欢的热门景点。著名童话作家汉斯·克里斯蒂安·安徒生在新港的三座不同房屋（20号、67号和18号）中生活了近20年。他在20号居住时写下了他的第一批童话。运河上停泊着许多历史悠久的木船，其中一些是提供游览的博物馆船。夏季期间，新港变得特别热闹，有餐厅和咖啡馆的户外座位、街头表演者以及提供运河游览的船只。冬季时，该地区会举办迷人的圣诞市场，氛围焕然一新。',
        historicalInfo: '新港由克里斯蒂安五世国王于1670年至1673年建造，由瑞典战俘挖掘。它是从海上通往旧内城的门户，使商人能够将货物直接运送到国王新广场。该地区长期以喧闹的酒吧和妓院而闻名，但已经被改造成一个受欢迎的旅游景点。',
        yearBuilt: '1670-1673年',
        architect: '克里斯蒂安五世国王'
      }
    }
  },
  {
    id: 'tivoli_gardens',
    cityId: 'copenhagen',
    name: 'Tivoli Gardens',
    lat: 55.673686,
    lng: 12.568105,
    radius: 100,
    narration: 'Welcome to Tivoli Gardens, one of the world\'s oldest operating amusement parks. This enchanting garden has been delighting visitors since 1843 with its rides, beautiful gardens, and magical atmosphere.',
    description: 'One of the world\'s oldest and most beautiful amusement parks',
    category: 'Amusement Park',
    detailedDescription: 'Tivoli Gardens is a world-famous amusement park and pleasure garden in Copenhagen. Opened in 1843, it is the third-oldest operating amusement park in the world and has inspired countless theme parks, including Disneyland. Walt Disney himself visited Tivoli several times and drew inspiration for his own parks. Tivoli combines traditional fairground rides with beautifully landscaped gardens, outdoor entertainment, and cultural attractions. The park features over 30 attractions including vintage wooden roller coasters, modern thrill rides, a carousel from 1943, and the famous Vertigo. Beyond the rides, Tivoli is renowned for its stunning gardens with thousands of flowers, illuminated at night by over 115,000 colored lights. The park hosts concerts at the open-air stage and concert hall, pantomime performances at the Peacock Theatre, and various cultural events throughout the year. During Halloween and Christmas, Tivoli transforms into a magical wonderland with special decorations and events. The park has become an integral part of Copenhagen culture and is visited by locals and tourists alike.',
    photos: [
      'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800',
      'https://images.unsplash.com/photo-1552560880-2482cef14240?w=800',
      'https://images.unsplash.com/photo-1533582064595-1b6f8c0a8e92?w=800'
    ],
    historicalInfo: 'Tivoli Gardens was founded on August 15, 1843 by Georg Carstensen. He persuaded King Christian VIII to let him create the park, arguing that "when the people are amusing themselves, they do not think about politics." The park quickly became popular and has remained a beloved institution in Danish culture.',
    yearBuilt: '1843',
    architect: 'Georg Carstensen',
    translations: {
      en: {
        name: 'Tivoli Gardens',
        narration: 'Welcome to Tivoli Gardens, one of the world\'s oldest operating amusement parks. This enchanting garden has been delighting visitors since 1843 with its rides, beautiful gardens, and magical atmosphere.',
        description: 'One of the world\'s oldest and most beautiful amusement parks',
        detailedDescription: 'Tivoli Gardens is a world-famous amusement park and pleasure garden in Copenhagen. Opened in 1843, it is the third-oldest operating amusement park in the world and has inspired countless theme parks, including Disneyland. Walt Disney himself visited Tivoli several times and drew inspiration for his own parks. Tivoli combines traditional fairground rides with beautifully landscaped gardens, outdoor entertainment, and cultural attractions. The park features over 30 attractions including vintage wooden roller coasters, modern thrill rides, a carousel from 1943, and the famous Vertigo. Beyond the rides, Tivoli is renowned for its stunning gardens with thousands of flowers, illuminated at night by over 115,000 colored lights. The park hosts concerts at the open-air stage and concert hall, pantomime performances at the Peacock Theatre, and various cultural events throughout the year. During Halloween and Christmas, Tivoli transforms into a magical wonderland with special decorations and events. The park has become an integral part of Copenhagen culture and is visited by locals and tourists alike.',
        historicalInfo: 'Tivoli Gardens was founded on August 15, 1843 by Georg Carstensen. He persuaded King Christian VIII to let him create the park, arguing that "when the people are amusing themselves, they do not think about politics." The park quickly became popular and has remained a beloved institution in Danish culture.',
        yearBuilt: '1843',
        architect: 'Georg Carstensen'
      },
      ko: {
        name: '티볼리 공원',
        narration: '세계에서 가장 오래된 놀이공원 중 하나인 티볼리 공원에 오신 것을 환영합니다. 이 매혹적인 정원은 1843년부터 놀이기구, 아름다운 정원, 마법 같은 분위기로 방문객들을 즐겁게 하고 있습니다.',
        description: '세계에서 가장 오래되고 아름다운 놀이공원 중 하나',
        detailedDescription: '티볼리 공원은 코펜하겐의 세계적으로 유명한 놀이공원이자 유원지입니다. 1843년에 개장한 이 공원은 세계에서 세 번째로 오래된 운영 중인 놀이공원이며 디즈니랜드를 포함한 수많은 테마파크에 영감을 주었습니다. 월트 디즈니 자신도 티볼리를 여러 번 방문했고 자신의 공원을 위한 영감을 얻었습니다. 티볼리는 전통적인 놀이기구를 아름답게 조경된 정원, 야외 엔터테인먼트, 문화 명소와 결합합니다. 공원에는 빈티지 목조 롤러코스터, 현대적인 스릴 놀이기구, 1943년 회전목마, 유명한 버티고를 포함한 30개 이상의 명소가 있습니다. 놀이기구 외에도 티볼리는 수천 송이의 꽃이 있는 멋진 정원으로 유명하며, 밤에는 115,000개 이상의 컬러 조명으로 조명됩니다. 공원은 야외 무대와 콘서트홀에서 콘서트, 피코크 극장에서 무언극 공연, 그리고 연중 다양한 문화 행사를 개최합니다. 할로윈과 크리스마스 기간에는 티볼리가 특별한 장식과 행사로 마법의 원더랜드로 변합니다. 공원은 코펜하겐 문화의 필수적인 부분이 되었으며 현지인과 관광객 모두가 방문합니다.',
        historicalInfo: '티볼리 공원은 1843년 8월 15일 게오르그 카르스텐센에 의해 설립되었습니다. 그는 "사람들이 즐기고 있을 때 정치에 대해 생각하지 않는다"고 주장하며 크리스티안 8세 왕을 설득하여 공원을 만들도록 했습니다. 공원은 빠르게 인기를 얻었고 덴마크 문화에서 사랑받는 기관으로 남아 있습니다.',
        yearBuilt: '1843년',
        architect: '게오르그 카르스텐센'
      },
      ja: {
        name: 'チボリ公園',
        narration: '世界最古の遊園地の一つ、チボリ公園へようこそ。この魅惑的な庭園は1843年以来、乗り物、美しい庭園、魔法のような雰囲気で訪問者を楽しませてきました。',
        description: '世界で最も古く美しい遊園地の一つ',
        detailedDescription: 'チボリ公園は、コペンハーゲンにある世界的に有名な遊園地および遊園地です。1843年に開園し、世界で3番目に古い運営中の遊園地であり、ディズニーランドを含む無数のテーマパークにインスピレーションを与えてきました。ウォルト・ディズニー自身も何度かチボリを訪れ、自分のパークのインスピレーションを得ました。チボリは伝統的な遊園地の乗り物と美しく造園された庭園、屋外エンターテインメント、文化的アトラクションを組み合わせています。公園には、ビンテージの木製ジェットコースター、現代的なスリルライド、1943年のメリーゴーランド、有名なバーティゴを含む30以上のアトラクションがあります。乗り物以外にも、チボリは数千の花がある見事な庭園で有名であり、夜には115,000以上のカラーライトで照らされます。公園は野外ステージとコンサートホールでコンサート、ピーコックシアターでパントマイムパフォーマンス、年間を通じてさまざまな文化イベントを開催しています。ハロウィンとクリスマスの期間中、チボリは特別な装飾とイベントで魔法の国に変わります。公園はコペンハーゲン文化の不可欠な部分となり、地元の人々と観光客の両方が訪れています。',
        historicalInfo: 'チボリ公園は1843年8月15日にゲオルグ・カールステンセンによって設立されました。彼は「人々が楽しんでいるとき、彼らは政治について考えない」と主張して、クリスチャン8世王を説得し、公園を作ることを許可させました。公園はすぐに人気を博し、デンマーク文化において愛される機関であり続けています。',
        yearBuilt: '1843年',
        architect: 'ゲオルグ・カールステンセン'
      },
      zh: {
        name: '趣伏里公园',
        narration: '欢迎来到趣伏里公园，世界上最古老的运营游乐园之一。这个迷人的花园自1843年以来一直以其游乐设施、美丽的花园和神奇的氛围让游客流连忘返。',
        description: '世界上最古老、最美丽的游乐园之一',
        detailedDescription: '趣伏里公园是哥本哈根世界著名的游乐园和游乐场。它于1843年开放，是世界上第三古老的运营游乐园，并激发了包括迪士尼乐园在内的无数主题公园的灵感。华特·迪士尼本人多次访问趣伏里，并从中获得了自己公园的灵感。趣伏里将传统的游乐场设施与美丽的景观花园、户外娱乐和文化景点相结合。公园拥有30多个景点，包括复古木制过山车、现代惊险游乐设施、1943年的旋转木马和著名的眩晕塔。除了游乐设施外，趣伏里还以其拥有数千朵鲜花的迷人花园而闻名，夜晚由115,000多盏彩灯照亮。公园在露天舞台和音乐厅举办音乐会，在孔雀剧院举办哑剧表演，全年举办各种文化活动。在万圣节和圣诞节期间，趣伏里会通过特殊的装饰和活动变成一个神奇的仙境。公园已成为哥本哈根文化不可分割的一部分，当地人和游客都会前来参观。',
        historicalInfo: '趣伏里公园于1843年8月15日由乔治·卡斯滕森创立。他说服克里斯蒂安八世国王让他创建公园，理由是"当人们娱乐时，他们不会考虑政治。"公园迅速流行起来，并一直是丹麦文化中深受喜爱的机构。',
        yearBuilt: '1843年',
        architect: '乔治·卡斯滕森'
      }
    }
  },
  // Oslo landmarks
  {
    id: 'viking_ship_museum',
    cityId: 'oslo',
    name: 'Viking Ship Museum',
    lat: 59.904722,
    lng: 10.684167,
    radius: 60,
    narration: 'Welcome to the Viking Ship Museum, home to the world\'s best-preserved Viking ships. These magnificent vessels from the 9th century offer a unique glimpse into Viking culture and seafaring prowess.',
    description: 'Home to the world\'s best-preserved Viking ships',
    category: 'Maritime Museum',
    detailedDescription: 'The Viking Ship Museum in Oslo houses some of the world\'s best-preserved Viking ships and artifacts from the Viking Age. The museum\'s centerpiece is three remarkable Viking longships: the Oseberg, Gokstad, and Tune ships, all dating from the 9th century. These ships were used as burial ships for high-ranking Vikings and were discovered in burial mounds around the Oslo Fjord. The Oseberg ship, discovered in 1904, is the most elaborately decorated and best preserved of the three, featuring intricate wood carvings on its prow and stern. It was used as a burial ship for two women, possibly a queen and her servant, and contained a wealth of grave goods including sleds, carts, beds, and textiles. The Gokstad ship, found in 1880, is a seaworthy ocean-going vessel that demonstrates the Vikings\' advanced shipbuilding techniques. A replica of this ship successfully crossed the Atlantic in 1893. The museum also displays artifacts from the burial mounds, providing insights into Viking daily life, craftsmanship, and burial customs. The ships represent the pinnacle of Viking Age engineering and showcase the maritime culture that enabled the Vikings to explore, trade, and raid across vast distances.',
    photos: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800'
    ],
    historicalInfo: 'The Viking Ship Museum was built in 1926 specifically to house the Oseberg ship discovery. The three Viking ships on display - the Oseberg (discovered 1904), Gokstad (1880), and Tune (1867) - were all found in burial mounds around the Oslo Fjord. These ships date from the 9th century and are among the most important Viking Age archaeological finds.',
    yearBuilt: '1926',
    architect: 'Arnstein Arneberg',
    translations: {
      en: {
        name: 'Viking Ship Museum',
        narration: 'Welcome to the Viking Ship Museum, home to the world\'s best-preserved Viking ships. These magnificent vessels from the 9th century offer a unique glimpse into Viking culture and seafaring prowess.',
        description: 'Home to the world\'s best-preserved Viking ships',
        detailedDescription: 'The Viking Ship Museum in Oslo houses some of the world\'s best-preserved Viking ships and artifacts from the Viking Age. The museum\'s centerpiece is three remarkable Viking longships: the Oseberg, Gokstad, and Tune ships, all dating from the 9th century. These ships were used as burial ships for high-ranking Vikings and were discovered in burial mounds around the Oslo Fjord. The Oseberg ship, discovered in 1904, is the most elaborately decorated and best preserved of the three, featuring intricate wood carvings on its prow and stern. It was used as a burial ship for two women, possibly a queen and her servant, and contained a wealth of grave goods including sleds, carts, beds, and textiles. The Gokstad ship, found in 1880, is a seaworthy ocean-going vessel that demonstrates the Vikings\' advanced shipbuilding techniques. A replica of this ship successfully crossed the Atlantic in 1893. The museum also displays artifacts from the burial mounds, providing insights into Viking daily life, craftsmanship, and burial customs. The ships represent the pinnacle of Viking Age engineering and showcase the maritime culture that enabled the Vikings to explore, trade, and raid across vast distances.',
        historicalInfo: 'The Viking Ship Museum was built in 1926 specifically to house the Oseberg ship discovery. The three Viking ships on display - the Oseberg (discovered 1904), Gokstad (1880), and Tune (1867) - were all found in burial mounds around the Oslo Fjord. These ships date from the 9th century and are among the most important Viking Age archaeological finds.',
        yearBuilt: '1926',
        architect: 'Arnstein Arneberg'
      },
      ko: {
        name: '바이킹 선박 박물관',
        narration: '세계에서 가장 잘 보존된 바이킹 선박이 있는 바이킹 선박 박물관에 오신 것을 환영합니다. 9세기의 이 장엄한 선박들은 바이킹 문화와 항해 기술에 대한 독특한 통찰을 제공합니다.',
        description: '세계에서 가장 잘 보존된 바이킹 선박이 있는 곳',
        detailedDescription: '오슬로의 바이킹 선박 박물관은 세계에서 가장 잘 보존된 바이킹 선박과 바이킹 시대의 유물을 소장하고 있습니다. 박물관의 중심은 9세기로 거슬러 올라가는 세 척의 놀라운 바이킹 롱십입니다: 오세베르그, 고크스타드, 투네 선박. 이 선박들은 고위 바이킹의 매장선으로 사용되었으며 오슬로 피요르드 주변의 고분에서 발견되었습니다. 1904년에 발견된 오세베르그 선박은 세 척 중 가장 정교하게 장식되고 가장 잘 보존되어 있으며, 선수와 선미에 복잡한 목각이 있습니다. 이 선박은 두 여성, 아마도 여왕과 그녀의 하인의 매장선으로 사용되었으며 썰매, 수레, 침대, 직물을 포함한 많은 부장품을 담고 있었습니다. 1880년에 발견된 고크스타드 선박은 바이킹의 진보된 조선 기술을 보여주는 항해 가능한 원양 선박입니다. 이 선박의 복제품은 1893년에 대서양을 성공적으로 횡단했습니다. 박물관은 또한 고분의 유물을 전시하여 바이킹의 일상생활, 장인 정신, 매장 관습에 대한 통찰을 제공합니다. 이 선박들은 바이킹 시대 공학의 정점을 나타내며 바이킹이 광대한 거리를 탐험하고 교역하고 약탈할 수 있게 한 해양 문화를 보여줍니다.',
        historicalInfo: '바이킹 선박 박물관은 1926년에 오세베르그 선박 발견을 수용하기 위해 특별히 건설되었습니다. 전시된 세 척의 바이킹 선박 - 오세베르그(1904년 발견), 고크스타드(1880년), 투네(1867년) - 는 모두 오슬로 피요르드 주변의 고분에서 발견되었습니다. 이 선박들은 9세기로 거슬러 올라가며 가장 중요한 바이킹 시대 고고학 발견 중 하나입니다.',
        yearBuilt: '1926년',
        architect: '아른스타인 아르네베르그'
      },
      ja: {
        name: 'ヴァイキング船博物館',
        narration: '世界で最も保存状態の良いヴァイキング船がある、ヴァイキング船博物館へようこそ。9世紀のこれらの壮大な船は、ヴァイキング文化と航海技術への独特な洞察を提供します。',
        description: '世界で最も保存状態の良いヴァイキング船がある場所',
        detailedDescription: 'オスロのヴァイキング船博物館には、世界で最も保存状態の良いヴァイキング船とヴァイキング時代の遺物が収蔵されています。博物館の中心は、9世紀にさかのぼる3隻の注目すべきヴァイキングロングシップです:オーセベルグ号、ゴクスタッド号、トゥーネ号。これらの船は高位のヴァイキングの埋葬船として使用され、オスロフィヨルド周辺の古墳で発見されました。1904年に発見されたオーセベルグ号は、3隻の中で最も精巧に装飾され、最も保存状態が良く、船首と船尾に複雑な木彫りが施されています。この船は2人の女性、おそらく女王とその召使いの埋葬船として使用され、そり、荷車、ベッド、織物を含む豊富な副葬品が含まれていました。1880年に発見されたゴクスタッド号は、ヴァイキングの高度な造船技術を示す航海可能な遠洋船です。この船のレプリカは1893年に大西洋を横断することに成功しました。博物館はまた、古墳からの遺物を展示し、ヴァイキングの日常生活、職人技、埋葬習慣への洞察を提供しています。これらの船は、ヴァイキング時代の工学の頂点を表し、ヴァイキングが広大な距離を探検し、貿易し、襲撃することを可能にした海洋文化を示しています。',
        historicalInfo: 'ヴァイキング船博物館は、オーセベルグ船の発見を収容するために1926年に特別に建設されました。展示されている3隻のヴァイキング船 - オーセベルグ号(1904年発見)、ゴクスタッド号(1880年)、トゥーネ号(1867年) - はすべてオスロフィヨルド周辺の古墳で発見されました。これらの船は9世紀にさかのぼり、最も重要なヴァイキング時代の考古学的発見の中にあります。',
        yearBuilt: '1926年',
        architect: 'アルンステイン・アルネベルグ'
      },
      zh: {
        name: '维京船博物馆',
        narration: '欢迎来到维京船博物馆，这里是世界上保存最完好的维京船的所在地。这些来自9世纪的宏伟船只为了解维京文化和航海技艺提供了独特的视角。',
        description: '世界上保存最完好的维京船的所在地',
        detailedDescription: '奥斯陆的维京船博物馆收藏着世界上保存最完好的维京船和维京时代的文物。博物馆的核心展品是三艘非凡的维京长船：奥塞贝格号、戈克斯塔号和图内号，都可追溯到9世纪。这些船被用作高级维京人的葬船，在奥斯陆峡湾周围的古墓中被发现。1904年发现的奥塞贝格号是三艘船中装饰最精美、保存最完好的，船头和船尾有复杂的木雕。它被用作两名女性（可能是女王和她的仆人）的葬船，包含了大量陪葬品，包括雪橇、马车、床和纺织品。1880年发现的戈克斯塔号是一艘适合航海的远洋船只，展示了维京人先进的造船技术。这艘船的复制品在1893年成功横渡了大西洋。博物馆还展示了古墓中的文物，提供了对维京人日常生活、工艺和葬礼习俗的洞察。这些船代表了维京时代工程的巅峰，展示了使维京人能够在广阔距离上探索、贸易和掠夺的海洋文化。',
        historicalInfo: '维京船博物馆建于1926年，专门用于安置奥塞贝格号船的发现。展出的三艘维京船——奥塞贝格号（1904年发现）、戈克斯塔号（1880年）和图内号（1867年）——都是在奥斯陆峡湾周围的古墓中发现的。这些船可追溯到9世纪，是最重要的维京时代考古发现之一。',
        yearBuilt: '1926年',
        architect: '阿恩斯坦·阿内贝格'
      }
    }
  },
  {
    id: 'oslo_opera_house',
    cityId: 'oslo',
    name: 'Oslo Opera House',
    lat: 59.907222,
    lng: 10.753333,
    radius: 80,
    narration: 'Welcome to the Oslo Opera House, a stunning architectural masterpiece rising from the Oslo Fjord. This modern landmark invites visitors to walk on its sloping roof for panoramic views of the city and fjord.',
    description: 'Norway\'s architectural masterpiece with a walkable roof',
    category: 'Opera House',
    detailedDescription: 'The Oslo Opera House is the home of the Norwegian National Opera and Ballet and one of Norway\'s most visited architectural landmarks. Designed by the Norwegian architecture firm Snøhetta, the building opened in 2008 and has won numerous international architecture awards, including the EU Prize for Contemporary Architecture in 2009. The building\'s most distinctive feature is its sloping white marble roof that appears to rise from the waters of the Oslo Fjord. The roof is accessible to the public and has become one of Oslo\'s most popular gathering spots, offering stunning 360-degree views of the city, harbor, and surrounding mountains. The design concept was inspired by Norwegian nature, particularly glaciers and icebergs, with the building appearing to float on the water\'s edge. The opera house features three stages and can seat over 1,364 people in the main auditorium. The interior showcases Norwegian craftsmanship with oak walls and floors, while the wave wall in the main foyer is covered with handmade oak panels. The building uses sustainable design principles and houses state-of-the-art performance facilities, making it both an architectural icon and a world-class cultural venue.',
    photos: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800'
    ],
    historicalInfo: 'The Oslo Opera House was designed by the Norwegian architectural firm Snøhetta and opened on April 12, 2008. It was the largest cultural building constructed in Norway since Nidaros Cathedral was completed around 1300. The building won the EU Prize for Contemporary Architecture (Mies van der Rohe Award) in 2009 and the World Architecture Festival Culture Award in 2008.',
    yearBuilt: '2008',
    architect: 'Snøhetta',
    translations: {
      en: {
        name: 'Oslo Opera House',
        narration: 'Welcome to the Oslo Opera House, a stunning architectural masterpiece rising from the Oslo Fjord. This modern landmark invites visitors to walk on its sloping roof for panoramic views of the city and fjord.',
        description: 'Norway\'s architectural masterpiece with a walkable roof',
        detailedDescription: 'The Oslo Opera House is the home of the Norwegian National Opera and Ballet and one of Norway\'s most visited architectural landmarks. Designed by the Norwegian architecture firm Snøhetta, the building opened in 2008 and has won numerous international architecture awards, including the EU Prize for Contemporary Architecture in 2009. The building\'s most distinctive feature is its sloping white marble roof that appears to rise from the waters of the Oslo Fjord. The roof is accessible to the public and has become one of Oslo\'s most popular gathering spots, offering stunning 360-degree views of the city, harbor, and surrounding mountains. The design concept was inspired by Norwegian nature, particularly glaciers and icebergs, with the building appearing to float on the water\'s edge. The opera house features three stages and can seat over 1,364 people in the main auditorium. The interior showcases Norwegian craftsmanship with oak walls and floors, while the wave wall in the main foyer is covered with handmade oak panels. The building uses sustainable design principles and houses state-of-the-art performance facilities, making it both an architectural icon and a world-class cultural venue.',
        historicalInfo: 'The Oslo Opera House was designed by the Norwegian architectural firm Snøhetta and opened on April 12, 2008. It was the largest cultural building constructed in Norway since Nidaros Cathedral was completed around 1300. The building won the EU Prize for Contemporary Architecture (Mies van der Rohe Award) in 2009 and the World Architecture Festival Culture Award in 2008.',
        yearBuilt: '2008',
        architect: 'Snøhetta'
      },
      ko: {
        name: '오슬로 오페라 하우스',
        narration: '오슬로 피요르드에서 솟아오르는 놀라운 건축 걸작 오슬로 오페라 하우스에 오신 것을 환영합니다. 이 현대적인 랜드마크는 방문객들을 경사진 지붕 위를 걸으며 도시와 피요르드의 파노라마 전망을 즐길 수 있도록 초대합니다.',
        description: '걸을 수 있는 지붕이 있는 노르웨이의 건축 걸작',
        detailedDescription: '오슬로 오페라 하우스는 노르웨이 국립 오페라 발레단의 본거지이자 노르웨이에서 가장 많이 방문하는 건축 랜드마크 중 하나입니다. 노르웨이 건축 회사 스뇌헤타가 설계한 이 건물은 2008년에 개관했으며 2009년 EU 현대 건축상을 포함한 수많은 국제 건축상을 수상했습니다. 건물의 가장 독특한 특징은 오슬로 피요르드의 물에서 솟아오르는 것처럼 보이는 경사진 흰색 대리석 지붕입니다. 지붕은 대중에게 개방되어 있으며 오슬로에서 가장 인기 있는 모임 장소 중 하나가 되었으며, 도시, 항구, 주변 산의 멋진 360도 전망을 제공합니다. 디자인 개념은 특히 빙하와 빙산과 같은 노르웨이 자연에서 영감을 받았으며, 건물이 물가에 떠 있는 것처럼 보입니다. 오페라 하우스는 3개의 무대를 갖추고 있으며 메인 강당에는 1,364명 이상을 수용할 수 있습니다. 내부는 오크 벽과 바닥으로 노르웨이 장인 정신을 보여주며, 메인 로비의 웨이브 벽은 수제 오크 패널로 덮여 있습니다. 건물은 지속 가능한 디자인 원칙을 사용하고 최첨단 공연 시설을 갖추고 있어 건축 아이콘이자 세계적 수준의 문화 공연장입니다.',
        historicalInfo: '오슬로 오페라 하우스는 노르웨이 건축 회사 스뇌헤타가 설계하여 2008년 4월 12일에 개관했습니다. 1300년경 니다로스 대성당이 완공된 이후 노르웨이에서 건설된 가장 큰 문화 건물이었습니다. 건물은 2009년 EU 현대 건축상(미스 반 데어 로에 상)과 2008년 세계 건축 페스티벌 문화상을 수상했습니다.',
        yearBuilt: '2008년',
        architect: '스뇌헤타'
      },
      ja: {
        name: 'オスロオペラハウス',
        narration: 'オスロフィヨルドから立ち上がる見事な建築の傑作、オスロオペラハウスへようこそ。この現代的なランドマークは、訪問者を傾斜した屋根の上を歩いて市内とフィヨルドのパノラマビューを楽しむよう招待します。',
        description: '歩ける屋根を持つノルウェーの建築の傑作',
        detailedDescription: 'オスロオペラハウスは、ノルウェー国立オペラバレエ団の本拠地であり、ノルウェーで最も訪問される建築的ランドマークの一つです。ノルウェーの建築事務所スノヘッタが設計したこの建物は、2008年に開館し、2009年のEU現代建築賞を含む数々の国際建築賞を受賞しています。建物の最も特徴的な特徴は、オスロフィヨルドの水面から立ち上がるように見える傾斜した白い大理石の屋根です。屋根は一般に公開されており、オスロで最も人気のある集まりスポットの一つとなり、市内、港、周辺の山々の見事な360度の景色を提供しています。デザインコンセプトは、特に氷河や氷山などのノルウェーの自然にインスピレーションを受けており、建物が水際に浮かんでいるように見えます。オペラハウスには3つのステージがあり、メインオーディトリアムには1,364人以上を収容できます。内部はオーク材の壁と床でノルウェーの職人技を披露し、メインロビーのウェーブウォールは手作りのオークパネルで覆われています。建物は持続可能なデザイン原則を使用し、最先端のパフォーマンス施設を備えているため、建築的アイコンであり世界クラスの文化会場でもあります。',
        historicalInfo: 'オスロオペラハウスは、ノルウェーの建築事務所スノヘッタによって設計され、2008年4月12日に開館しました。1300年頃にニダロス大聖堂が完成して以来、ノルウェーで建設された最大の文化建築物でした。この建物は2009年にEU現代建築賞（ミース・ファン・デル・ローエ賞）と2008年の世界建築フェスティバル文化賞を受賞しました。',
        yearBuilt: '2008年',
        architect: 'スノヘッタ'
      },
      zh: {
        name: '奥斯陆歌剧院',
        narration: '欢迎来到奥斯陆歌剧院，这座从奥斯陆峡湾拔地而起的令人惊叹的建筑杰作。这个现代地标邀请游客在其倾斜的屋顶上行走，欣赏城市和峡湾的全景。',
        description: '拥有可步行屋顶的挪威建筑杰作',
        detailedDescription: '奥斯陆歌剧院是挪威国家歌剧院和芭蕾舞团的所在地，也是挪威访问量最大的建筑地标之一。由挪威建筑公司斯诺赫塔设计，该建筑于2008年开放，并获得了众多国际建筑奖项，包括2009年欧盟当代建筑奖。建筑最显著的特点是从奥斯陆峡湾水面升起的倾斜白色大理石屋顶。屋顶向公众开放，已成为奥斯陆最受欢迎的聚会场所之一，提供城市、港口和周围山脉的壮丽360度景观。设计理念受到挪威自然的启发，特别是冰川和冰山，建筑似乎漂浮在水边。歌剧院拥有三个舞台，主礼堂可容纳1,364多人。内部展示了挪威工艺，配有橡木墙壁和地板，主大厅的波浪墙覆盖着手工制作的橡木面板。建筑采用可持续设计原则，并设有最先进的表演设施，使其既是建筑标志，又是世界级的文化场所。',
        historicalInfo: '奥斯陆歌剧院由挪威建筑公司斯诺赫塔设计，于2008年4月12日开放。这是自1300年左右尼达罗斯大教堂建成以来挪威建造的最大文化建筑。该建筑在2009年获得了欧盟当代建筑奖（密斯·凡德罗奖）和2008年世界建筑节文化奖。',
        yearBuilt: '2008年',
        architect: '斯诺赫塔'
      }
    }
  },
  
  // Cebu, Philippines landmarks
  {
    id: 'magellans-cross',
    cityId: 'cebu',
    name: 'Magellan\'s Cross',
    lat: 10.293475,
    lng: 123.901984,
    radius: 50,
    narration: 'Welcome to Magellan\'s Cross, a historic landmark that marks the birth of Christianity in the Philippines. This wooden cross was planted by Ferdinand Magellan in 1521.',
    description: 'Historic wooden cross planted by Ferdinand Magellan in 1521',
    category: 'Historical',
    detailedDescription: 'Magellan\'s Cross is a Christian cross planted by Portuguese and Spanish explorers as ordered by Ferdinand Magellan upon arriving in Cebu in the Philippines on April 21, 1521. This cross is housed in a chapel next to the Basilica del Santo Niño on Magallanes Street, just in front of the Cebu City Hall. The original wooden cross is encased in tindalo wood to protect it from souvenir hunters who were chipping away pieces of the cross. A sign below the cross claims it was the original cross planted by Magellan, while others claim the original cross has been destroyed and that the cross is a replica. The ceiling of the pavilion is decorated with paintings depicting the story of how Magellan brought Christianity to the Philippines. The cross is a revered relic and one of the most visited spots in Cebu City.',
    photos: [
      'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=800',
      'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
    ],
    historicalInfo: 'The cross was planted by Portuguese explorer Ferdinand Magellan on April 21, 1521, when he arrived in Cebu and baptized the island\'s first Catholic converts.',
    yearBuilt: '1521',
    architect: 'Ferdinand Magellan',
    translations: {
      en: {
        name: 'Magellan\'s Cross',
        narration: 'Welcome to Magellan\'s Cross, a historic landmark that marks the birth of Christianity in the Philippines. This wooden cross was planted by Ferdinand Magellan in 1521.',
        description: 'Historic wooden cross planted by Ferdinand Magellan in 1521',
        historicalInfo: 'The cross was planted by Portuguese explorer Ferdinand Magellan on April 21, 1521, when he arrived in Cebu and baptized the island\'s first Catholic converts.'
      },
      ko: {
        name: '마젤란의 십자가',
        narration: '필리핀 기독교의 탄생을 상징하는 역사적인 랜드마크, 마젤란의 십자가에 오신 것을 환영합니다. 이 나무 십자가는 1521년 페르디난드 마젤란이 세웠습니다.',
        description: '1521년 페르디난드 마젤란이 세운 역사적인 나무 십자가',
        historicalInfo: '이 십자가는 1521년 4월 21일 포르투갈 탐험가 페르디난드 마젤란이 세부에 도착하여 섬의 첫 가톨릭 신자들에게 세례를 주었을 때 세워졌습니다.'
      }
    }
  },
  {
    id: 'basilica-santo-nino',
    cityId: 'cebu',
    name: 'Basilica del Santo Niño',
    lat: 10.293889,
    lng: 123.902778,
    radius: 60,
    narration: 'Welcome to the Basilica del Santo Niño, the oldest Roman Catholic church in the Philippines. This sacred site houses the miraculous statue of the Child Jesus.',
    description: 'Oldest Roman Catholic church in the Philippines, established in 1565',
    category: 'Religious',
    detailedDescription: 'The Basilica Minore del Santo Niño de Cebú is a minor basilica in Cebu City in the Philippines that was founded in 1565 by Fray Andrés de Urdaneta and Fray Diego de Herrera. It is the oldest Roman Catholic church in the country, built on the spot where the image of the Santo Niño de Cebú was found during the expedition of Miguel López de Legazpi. The church was initially made of bamboo and palm leaves and was destroyed by fire. The present-day stone church was completed in 1735. The church has been rebuilt several times over the centuries due to fire and the ravages of war. The Basilica houses the Santo Niño, a statue of the Child Jesus believed to be left behind by Ferdinand Magellan in 1521 and miraculously found intact 44 years later despite a fire. The image is the oldest Christian relic in the Philippines and is believed to be miraculous by devotees. Every third Sunday of January, the Basilica is the center of the Sinulog Festival, one of the country\'s biggest religious and cultural celebrations.',
    photos: [
      'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=800',
      'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
    ],
    historicalInfo: 'Founded in 1565, it is the oldest Roman Catholic church in the Philippines. The church houses the Santo Niño statue, believed to be left by Magellan in 1521.',
    yearBuilt: '1565',
    architect: 'Fray Andrés de Urdaneta',
    translations: {
      en: {
        name: 'Basilica del Santo Niño',
        narration: 'Welcome to the Basilica del Santo Niño, the oldest Roman Catholic church in the Philippines. This sacred site houses the miraculous statue of the Child Jesus.',
        description: 'Oldest Roman Catholic church in the Philippines, established in 1565',
        historicalInfo: 'Founded in 1565, it is the oldest Roman Catholic church in the Philippines. The church houses the Santo Niño statue, believed to be left by Magellan in 1521.'
      },
      ko: {
        name: '산토 니뇨 성당',
        narration: '필리핀에서 가장 오래된 로마 가톨릭 교회인 산토 니뇨 성당에 오신 것을 환영합니다. 이 성스러운 장소에는 기적적인 아기 예수 상이 보관되어 있습니다.',
        description: '1565년에 설립된 필리핀에서 가장 오래된 로마 가톨릭 교회',
        historicalInfo: '1565년에 설립되어 필리핀에서 가장 오래된 로마 가톨릭 교회입니다. 교회에는 1521년 마젤란이 남긴 것으로 여겨지는 산토 니뇨 상이 보관되어 있습니다.'
      }
    }
  },
  {
    id: 'fort-san-pedro',
    cityId: 'cebu',
    name: 'Fort San Pedro',
    lat: 10.292222,
    lng: 123.905556,
    radius: 60,
    narration: 'Welcome to Fort San Pedro, the oldest triangular fort in the Philippines. This Spanish colonial fortress was built in the 16th century and stands as a testament to Cebu\'s rich history.',
    description: 'Oldest triangular Spanish colonial fortress in the Philippines',
    category: 'Historical',
    detailedDescription: 'Fort San Pedro is a military defense structure in Cebu City, built by Spanish and indigenous Cebuano laborers under the command of Spanish conquistador Miguel López de Legazpi and the city\'s first Spanish governor. The fort is triangular in shape with two sides facing the sea and one facing land. It was initially made of wood and later reconstructed with stone in the 17th century. The fort has served many purposes throughout history - from a Spanish citadel to an American army garrison, and during World War II, it was used by the Japanese as a prisoner of war camp. Today, it has been restored and serves as a tourist attraction and museum. The fort contains several relics and artifacts from the Spanish period, including cannons, sculptures, and paintings. The peaceful gardens and historic atmosphere make it a popular spot for both tourists and locals.',
    photos: [
      'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=800',
      'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
    ],
    historicalInfo: 'Built in 1565 under the command of Miguel López de Legazpi, it is the oldest triangular fort in the Philippines and one of the oldest Spanish colonial fortifications in the country.',
    yearBuilt: '1565',
    architect: 'Miguel López de Legazpi',
    translations: {
      en: {
        name: 'Fort San Pedro',
        narration: 'Welcome to Fort San Pedro, the oldest triangular fort in the Philippines. This Spanish colonial fortress was built in the 16th century and stands as a testament to Cebu\'s rich history.',
        description: 'Oldest triangular Spanish colonial fortress in the Philippines',
        historicalInfo: 'Built in 1565 under the command of Miguel López de Legazpi, it is the oldest triangular fort in the Philippines and one of the oldest Spanish colonial fortifications in the country.'
      },
      ko: {
        name: '산 페드로 요새',
        narration: '필리핀에서 가장 오래된 삼각형 요새인 산 페드로 요새에 오신 것을 환영합니다. 이 스페인 식민지 요새는 16세기에 건설되었으며 세부의 풍부한 역사를 증명합니다.',
        description: '필리핀에서 가장 오래된 삼각형 스페인 식민지 요새',
        historicalInfo: '1565년 미구엘 로페스 데 레가스피의 지휘 하에 건설되었으며, 필리핀에서 가장 오래된 삼각형 요새이자 스페인 식민지 시대 최고(最古)의 요새 중 하나입니다.'
      }
    }
  },
  {
    id: 'tops-lookout',
    cityId: 'cebu',
    name: 'TOPS Lookout',
    lat: 10.350278,
    lng: 123.8175,
    radius: 70,
    narration: 'Welcome to TOPS Lookout, offering breathtaking panoramic views of Cebu City and the surrounding islands. This scenic viewpoint sits 2,000 feet above sea level.',
    description: 'Scenic mountain viewpoint with 360-degree views of Cebu',
    category: 'Viewpoint',
    detailedDescription: 'TOPS, which stands for Transcentral Highway Observation Park, is a popular mountain viewpoint located in the Busay Hills of Cebu City. Situated 2,000 feet above sea level, it offers spectacular 360-degree panoramic views of Metro Cebu, Mactan Island, Bohol, and neighboring islands. The lookout is especially famous for its stunning views during sunrise and sunset, and the glittering city lights at night create a romantic atmosphere. The area features several viewing decks, benches, and open spaces perfect for picnics and photo opportunities. Local vendors sell snacks, drinks, and souvenirs. The cool mountain breeze provides a refreshing escape from the tropical heat of the city below. TOPS has become a must-visit destination for both locals and tourists seeking Instagram-worthy photos and a peaceful retreat.',
    photos: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800'
    ],
    historicalInfo: 'TOPS Lookout was developed as a scenic viewpoint along the Transcentral Highway and has become one of Cebu\'s most popular tourist destinations for its stunning panoramic views.',
    yearBuilt: '1990s',
    architect: 'Local Government',
    translations: {
      en: {
        name: 'TOPS Lookout',
        narration: 'Welcome to TOPS Lookout, offering breathtaking panoramic views of Cebu City and the surrounding islands. This scenic viewpoint sits 2,000 feet above sea level.',
        description: 'Scenic mountain viewpoint with 360-degree views of Cebu',
        historicalInfo: 'TOPS Lookout was developed as a scenic viewpoint along the Transcentral Highway and has become one of Cebu\'s most popular tourist destinations for its stunning panoramic views.'
      },
      ko: {
        name: 'TOPS 전망대',
        narration: '세부시와 주변 섬들의 숨막히는 파노라마 전망을 제공하는 TOPS 전망대에 오신 것을 환영합니다. 이 경치 좋은 전망대는 해발 2,000피트에 위치해 있습니다.',
        description: '세부의 360도 전망을 제공하는 경치 좋은 산악 전망대',
        historicalInfo: 'TOPS 전망대는 트랜스센트럴 하이웨이를 따라 경치 좋은 전망대로 개발되었으며 놀라운 파노라마 전망으로 세부의 가장 인기있는 관광지 중 하나가 되었습니다.'
      }
    }
  },
  {
    id: 'taoist-temple-cebu',
    cityId: 'cebu',
    name: 'Taoist Temple',
    lat: 10.346667,
    lng: 123.879444,
    radius: 60,
    narration: 'Welcome to the Cebu Taoist Temple, a beautiful place of worship located in Beverly Hills. This ornate temple offers stunning architecture and panoramic views of Cebu City.',
    description: 'Chinese Taoist temple with intricate architecture',
    category: 'Religious',
    detailedDescription: 'The Cebu Taoist Temple is located in the upscale Beverly Hills subdivision of Cebu City, standing 300 meters above sea level. Built in 1972 by the city\'s substantial Chinese community, this magnificent temple serves as a center of worship for Taoism, one of China\'s oldest religions. The temple features ornate Chinese architecture with multi-tiered roofs, red pillars, and intricate dragon designs. Visitors must climb 81 steps (representing 81 chapters of Taoism scriptures) to reach the main temple area. Inside, devotees light joss sticks and have their fortune told. The temple grounds offer spectacular panoramic views of downtown Cebu and the surrounding areas. The architecture showcases traditional Chinese design elements including elaborate carvings, colorful decorations, and symbolic representations of Taoist beliefs. The peaceful atmosphere and beautiful surroundings make it a popular destination for both worshippers and tourists.',
    photos: [
      'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800',
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=800',
      'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800',
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1548585744-6e2d7c1e1a21?w=800',
      'https://images.unsplash.com/photo-1590498380394-8db1bf58af6e?w=800'
    ],
    historicalInfo: 'Built in 1972 by Cebu\'s Chinese community, the Taoist Temple serves as a center of worship for Taoism and showcases traditional Chinese architectural design.',
    yearBuilt: '1972',
    architect: 'Chinese Community of Cebu',
    translations: {
      en: {
        name: 'Taoist Temple',
        narration: 'Welcome to the Cebu Taoist Temple, a beautiful place of worship located in Beverly Hills. This ornate temple offers stunning architecture and panoramic views of Cebu City.',
        description: 'Chinese Taoist temple with intricate architecture',
        historicalInfo: 'Built in 1972 by Cebu\'s Chinese community, the Taoist Temple serves as a center of worship for Taoism and showcases traditional Chinese architectural design.',
        yearBuilt: '1972',
        architect: 'Chinese Community of Cebu'
      },
      it: {
        name: 'Tempio Taoista',
        narration: 'Benvenuto al Tempio Taoista di Cebu, un bellissimo luogo di culto situato a Beverly Hills. Questo tempio ornato offre un\'architettura stupenda e viste panoramiche della città di Cebu.',
        description: 'Tempio taoista cinese con architettura intricata',
        historicalInfo: 'Costruito nel 1972 dalla comunità cinese di Cebu, il Tempio Taoista serve come centro di culto per il Taoismo e mostra il design architettonico cinese tradizionale.',
        yearBuilt: '1972',
        architect: 'Comunità Cinese di Cebu'
      },
      ko: {
        name: '타오이스트 사원',
        narration: '베벌리 힐스에 위치한 아름다운 예배 장소인 세부 타오이스트 사원에 오신 것을 환영합니다. 이 화려한 사원은 멋진 건축물과 세부시의 파노라마 전망을 제공합니다.',
        description: '복잡한 건축물을 가진 중국 도교 사원',
        historicalInfo: '1972년 세부의 중국 공동체에 의해 건설된 타오이스트 사원은 도교의 예배 센터 역할을 하며 전통적인 중국 건축 디자인을 보여줍니다.',
        yearBuilt: '1972',
        architect: '세부 중국 공동체'
      }
    }
  },
  {
    id: 'cebu-heritage-monument',
    cityId: 'cebu',
    name: 'Cebu Heritage Monument',
    lat: 10.294167,
    lng: 123.897778,
    radius: 50,
    narration: 'Welcome to the Cebu Heritage Monument, a stunning tableau that depicts significant events in Cebu\'s history. This massive sculpture tells the story of the Philippines through intricate bronze and concrete artworks.',
    description: 'Monumental sculpture depicting Cebu\'s history',
    category: 'Cultural Heritage',
    detailedDescription: 'The Heritage of Cebu Monument is a historical landmark located in Colon Street, Cebu City. Created by Cebuano sculptor Eduardo Castrillo, this grand monument was inaugurated in December 2000 to commemorate significant moments and people in Cebu\'s history. The sculpture is a massive tableau made of brass, bronze, concrete, and steel, depicting major historical events including Magellan\'s arrival, the first Catholic baptism in the Philippines, the Battle of Mactan, and the revolution against Spain. The monument stands as a centerpiece in the Parian district, which was historically the Chinese trading area. The intricate details capture the essence of Filipino heritage, featuring local heroes, religious figures, and ordinary citizens who shaped Cebu\'s identity. At night, the monument is beautifully illuminated, making it a popular photo spot. The surrounding area has been developed into a heritage park, making it an important cultural and tourist destination.',
    photos: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      'https://images.unsplash.com/photo-1523509433743-6f42a58221df?w=800',
      'https://images.unsplash.com/photo-1590498380394-8db1bf58af6e?w=800',
      'https://images.unsplash.com/photo-1548585744-6e2d7c1e1a21?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1598559862042-31ebfe8e09f2?w=800',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800'
    ],
    historicalInfo: 'Created by Eduardo Castrillo and inaugurated in December 2000, this monument depicts major events in Cebu\'s history including Magellan\'s arrival and the Battle of Mactan.',
    yearBuilt: '2000',
    architect: 'Eduardo Castrillo',
    translations: {
      en: {
        name: 'Cebu Heritage Monument',
        narration: 'Welcome to the Cebu Heritage Monument, a stunning tableau that depicts significant events in Cebu\'s history. This massive sculpture tells the story of the Philippines through intricate bronze and concrete artworks.',
        description: 'Monumental sculpture depicting Cebu\'s history',
        historicalInfo: 'Created by Eduardo Castrillo and inaugurated in December 2000, this monument depicts major events in Cebu\'s history including Magellan\'s arrival and the Battle of Mactan.',
        yearBuilt: '2000',
        architect: 'Eduardo Castrillo'
      },
      it: {
        name: 'Monumento del Patrimonio di Cebu',
        narration: 'Benvenuto al Monumento del Patrimonio di Cebu, uno splendido tableau che raffigura eventi significativi nella storia di Cebu. Questa massiccia scultura racconta la storia delle Filippine attraverso intricate opere d\'arte in bronzo e cemento.',
        description: 'Scultura monumentale che raffigura la storia di Cebu',
        historicalInfo: 'Creato da Eduardo Castrillo e inaugurato nel dicembre 2000, questo monumento raffigura eventi importanti nella storia di Cebu tra cui l\'arrivo di Magellano e la Battaglia di Mactan.',
        yearBuilt: '2000',
        architect: 'Eduardo Castrillo'
      },
      ko: {
        name: '세부 문화유산 기념비',
        narration: '세부 역사의 중요한 사건들을 묘사한 멋진 장면인 세부 문화유산 기념비에 오신 것을 환영합니다. 이 거대한 조각품은 복잡한 청동과 콘크리트 예술 작품을 통해 필리핀의 이야기를 전합니다.',
        description: '세부의 역사를 묘사한 기념비적 조각품',
        historicalInfo: '에두아르도 카스트리요가 만들고 2000년 12월에 제막된 이 기념비는 마젤란의 도착과 막탄 전투를 포함한 세부 역사의 주요 사건을 묘사합니다.',
        yearBuilt: '2000',
        architect: '에두아르도 카스트리요'
      }
    }
  },
  {
    id: 'sirao-flower-garden',
    cityId: 'cebu',
    name: 'Sirao Flower Garden',
    lat: 10.386111,
    lng: 123.824722,
    radius: 80,
    narration: 'Welcome to Sirao Flower Garden, Cebu\'s colorful "Little Amsterdam". This vibrant garden features beautiful flower fields, especially the iconic celosia flowers that bloom year-round.',
    description: 'Colorful flower garden known as Cebu\'s Little Amsterdam',
    category: 'Garden & Nature',
    detailedDescription: 'Sirao Flower Garden, affectionately called "Little Amsterdam" by locals, is a picturesque flower farm located in the highlands of Cebu City. Situated in Barangay Sirao, about 2,000 feet above sea level, the garden offers cool mountain air and stunning views. The garden is famous for its vibrant celosia flowers, which bloom in brilliant shades of red, pink, orange, and yellow throughout the year. The colorful flower beds are arranged in neat rows, creating a stunning visual spectacle reminiscent of Dutch tulip fields. Beyond celosia, the garden also features other flowers and plants including sunflowers, zinnias, and various ornamental plants. The site has become increasingly popular on social media, attracting photographers and nature lovers. Various photo installations and viewing decks have been added to enhance the visitor experience. The garden is family-owned and operated, representing the entrepreneurial spirit of local farmers who transformed their vegetable farm into a tourist attraction.',
    photos: [
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800',
      'https://images.unsplash.com/photo-1464699908537-0954e50791ee?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
      'https://images.unsplash.com/photo-1592422746942-44e05e70a8bc?w=800',
      'https://images.unsplash.com/photo-1563784462041-5f97ac9523dd?w=800',
      'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800'
    ],
    historicalInfo: 'Originally a vegetable farm, Sirao Flower Garden was transformed into a tourist attraction by local farmers and has become famous on social media as Cebu\'s "Little Amsterdam".',
    yearBuilt: '2015',
    architect: 'Local Farmers',
    translations: {
      en: {
        name: 'Sirao Flower Garden',
        narration: 'Welcome to Sirao Flower Garden, Cebu\'s colorful "Little Amsterdam". This vibrant garden features beautiful flower fields, especially the iconic celosia flowers that bloom year-round.',
        description: 'Colorful flower garden known as Cebu\'s Little Amsterdam',
        historicalInfo: 'Originally a vegetable farm, Sirao Flower Garden was transformed into a tourist attraction by local farmers and has become famous on social media as Cebu\'s "Little Amsterdam".',
        yearBuilt: '2015',
        architect: 'Local Farmers'
      },
      it: {
        name: 'Giardino dei Fiori di Sirao',
        narration: 'Benvenuto al Giardino dei Fiori di Sirao, la colorata "Piccola Amsterdam" di Cebu. Questo giardino vibrante presenta bellissimi campi di fiori, specialmente gli iconici fiori di celosia che sbocciano tutto l\'anno.',
        description: 'Giardino di fiori colorato conosciuto come la Piccola Amsterdam di Cebu',
        historicalInfo: 'Originariamente una fattoria di verdure, il Giardino dei Fiori di Sirao è stato trasformato in un\'attrazione turistica dagli agricoltori locali ed è diventato famoso sui social media come la "Piccola Amsterdam" di Cebu.',
        yearBuilt: '2015',
        architect: 'Agricoltori Locali'
      },
      ko: {
        name: '시라오 플라워 가든',
        narration: '세부의 화려한 "리틀 암스테르담"인 시라오 플라워 가든에 오신 것을 환영합니다. 이 활기찬 정원은 일년 내내 피는 상징적인 셀로시아 꽃을 특징으로 아름다운 꽃밭을 선보입니다.',
        description: '세부의 리틀 암스테르담으로 알려진 화려한 꽃 정원',
        historicalInfo: '원래 채소 농장이었던 시라오 플라워 가든은 지역 농부들에 의해 관광 명소로 변모했으며 소셜 미디어에서 세부의 "리틀 암스테르담"으로 유명해졌습니다.',
        yearBuilt: '2015',
        architect: '지역 농부들'
      }
    }
  },

  // Singapore landmarks
  {
    id: 'marina-bay-sands',
    cityId: 'singapore',
    name: 'Marina Bay Sands',
    lat: 1.2837,
    lng: 103.8607,
    radius: 70,
    narration: 'Welcome to Marina Bay Sands, Singapore\'s most iconic landmark. This integrated resort features a stunning rooftop infinity pool with spectacular views of the city skyline.',
    description: 'Iconic integrated resort with rooftop infinity pool',
    category: 'Modern Architecture',
    detailedDescription: 'Marina Bay Sands is an integrated resort fronting Marina Bay in Singapore. Developed by Las Vegas Sands at a cost of $5.88 billion, it opened in 2010 and is the world\'s most expensive standalone casino property. The resort includes a 2,561-room hotel, a 120,000-square-meter convention-exhibition center, a mall with a canal running through it, two theaters, museums, restaurants by celebrity chefs, two floating pavilions, and the world-famous SkyPark. The SkyPark, a ship-shaped structure atop the three hotel towers, features a 150-meter infinity pool, the world\'s largest rooftop infinity pool, offering breathtaking 360-degree views of Singapore. The resort has become an architectural icon and a symbol of modern Singapore, featured in countless movies, TV shows, and photographs. The design by architect Moshe Safdie was inspired by stacked decks of cards.',
    photos: [
      'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
      'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'
    ],
    historicalInfo: 'Opened in 2010, Marina Bay Sands was developed by Las Vegas Sands at a cost of $5.88 billion, making it the world\'s most expensive standalone casino property.',
    yearBuilt: '2010',
    architect: 'Moshe Safdie',
    translations: {
      en: {
        name: 'Marina Bay Sands',
        narration: 'Welcome to Marina Bay Sands, Singapore\'s most iconic landmark. This integrated resort features a stunning rooftop infinity pool with spectacular views of the city skyline.',
        description: 'Iconic integrated resort with rooftop infinity pool',
        historicalInfo: 'Opened in 2010, Marina Bay Sands was developed by Las Vegas Sands at a cost of $5.88 billion, making it the world\'s most expensive standalone casino property.'
      },
      ko: {
        name: '마리나 베이 샌즈',
        narration: '싱가포르의 가장 상징적인 랜드마크인 마리나 베이 샌즈에 오신 것을 환영합니다. 이 통합 리조트는 도시 스카이라인의 장관을 이루는 전망을 제공하는 멋진 옥상 인피니티 풀을 특징으로 합니다.',
        description: '옥상 인피니티 풀이 있는 상징적인 통합 리조트',
        historicalInfo: '2010년에 개장한 마리나 베이 샌즈는 라스베이거스 샌즈가 58억 8천만 달러를 들여 개발하여 세계에서 가장 비싼 독립형 카지노 부동산이 되었습니다.'
      }
    }
  },
  {
    id: 'merlion-park',
    cityId: 'singapore',
    name: 'Merlion Park',
    lat: 1.286915,
    lng: 103.85452,
    radius: 50,
    narration: 'Welcome to Merlion Park, home to Singapore\'s national icon. The Merlion statue, with the head of a lion and the body of a fish, symbolizes Singapore\'s origins as a fishing village.',
    description: 'Singapore\'s national icon and symbol',
    category: 'Monument',
    detailedDescription: 'The Merlion is the official mascot of Singapore, depicted as a mythical creature with a lion\'s head and a fish\'s body. The original Merlion structure measures 8.6 meters tall and spouts water from its mouth. Designed by Fraser Brunner and sculpted by Lim Nang Seng, it was unveiled in 1972 by Prime Minister Lee Kuan Yew. The fish body represents Singapore\'s origin as a fishing village when it was called Temasek, meaning "sea town" in Old Javanese. The lion head represents Singapura, meaning "lion city" in Sanskrit, as according to legend, a Sumatran prince saw a lion on the island and named it Singapura. The park offers stunning views of Marina Bay Sands, the ArtScience Museum, and the Singapore skyline. It\'s one of Singapore\'s most visited attractions and a popular photo spot.',
    photos: [
      'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800',
      'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'
    ],
    historicalInfo: 'The Merlion was designed by Fraser Brunner for the Singapore Tourism Board in 1964 and unveiled by Prime Minister Lee Kuan Yew on September 15, 1972.',
    yearBuilt: '1972',
    architect: 'Fraser Brunner (designer), Lim Nang Seng (sculptor)',
    translations: {
      en: {
        name: 'Merlion Park',
        narration: 'Welcome to Merlion Park, home to Singapore\'s national icon. The Merlion statue, with the head of a lion and the body of a fish, symbolizes Singapore\'s origins as a fishing village.',
        description: 'Singapore\'s national icon and symbol',
        historicalInfo: 'The Merlion was designed by Fraser Brunner for the Singapore Tourism Board in 1964 and unveiled by Prime Minister Lee Kuan Yew on September 15, 1972.'
      },
      ko: {
        name: '멀라이언 공원',
        narration: '싱가포르의 국가 상징인 멀라이언의 본거지인 멀라이언 공원에 오신 것을 환영합니다. 사자의 머리와 물고기의 몸을 가진 멀라이언 상은 어촌 마을로서의 싱가포르의 기원을 상징합니다.',
        description: '싱가포르의 국가 아이콘이자 상징',
        historicalInfo: '멀라이언은 1964년 프레이저 브루너가 싱가포르 관광청을 위해 디자인했으며 1972년 9월 15일 리콴유 총리에 의해 공개되었습니다.'
      }
    }
  },
  {
    id: 'gardens-by-the-bay',
    cityId: 'singapore',
    name: 'Gardens by the Bay',
    lat: 1.281563,
    lng: 103.86356,
    radius: 100,
    narration: 'Welcome to Gardens by the Bay, a futuristic garden featuring the iconic Supertree Grove. These vertical gardens are a stunning blend of nature and technology.',
    description: 'Futuristic garden with iconic Supertree Grove',
    category: 'Park & Garden',
    detailedDescription: 'Gardens by the Bay is a nature park spanning 101 hectares in the heart of Singapore, adjacent to the Marina Reservoir. The park consists of three waterfront gardens: Bay South Garden, Bay East Garden, and Bay Central Garden. The most famous attraction is the Supertree Grove, featuring 18 tree-like vertical gardens ranging from 25 to 50 meters tall. Eleven Supertrees are embedded with solar panels to harness solar energy. The park also features two cooled conservatories - the Flower Dome and Cloud Forest - both among the world\'s largest climate-controlled greenhouses. The Flower Dome replicates a cool-dry Mediterranean climate, while the Cloud Forest showcases plants from tropical mountain regions. At night, the Garden Rhapsody light and sound show illuminates the Supertrees. Opened in 2012, Gardens by the Bay has won numerous international awards for its innovative design and sustainability features.',
    photos: [
      'https://images.unsplash.com/photo-1506351421178-63b52a2d0b1c?w=800',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800'
    ],
    historicalInfo: 'Opened in 2012, Gardens by the Bay was developed at a cost of over $1 billion to transform Singapore into a "City in a Garden". It has won numerous international horticulture and design awards.',
    yearBuilt: '2012',
    architect: 'Grant Associates, Wilkinson Eyre',
    translations: {
      en: {
        name: 'Gardens by the Bay',
        narration: 'Welcome to Gardens by the Bay, a futuristic garden featuring the iconic Supertree Grove. These vertical gardens are a stunning blend of nature and technology.',
        description: 'Futuristic garden with iconic Supertree Grove',
        historicalInfo: 'Opened in 2012, Gardens by the Bay was developed at a cost of over $1 billion to transform Singapore into a "City in a Garden". It has won numerous international horticulture and design awards.'
      },
      ko: {
        name: '가든스 바이 더 베이',
        narration: '상징적인 슈퍼트리 그로브를 특징으로 하는 미래지향적인 정원인 가든스 바이 더 베이에 오신 것을 환영합니다. 이 수직 정원은 자연과 기술의 놀라운 조화입니다.',
        description: '상징적인 슈퍼트리 그로브가 있는 미래지향적인 정원',
        historicalInfo: '2012년에 개장한 가든스 바이 더 베이는 싱가포르를 "정원 속의 도시"로 변모시키기 위해 10억 달러 이상의 비용으로 개발되었습니다. 수많은 국제 원예 및 디자인 상을 수상했습니다.'
      }
    }
  },
  {
    id: 'singapore-flyer',
    cityId: 'singapore',
    name: 'Singapore Flyer',
    lat: 1.28925,
    lng: 103.863,
    radius: 60,
    narration: 'Welcome to the Singapore Flyer, one of the world\'s largest observation wheels. Enjoy breathtaking 360-degree views of Singapore and beyond from 165 meters above ground.',
    description: 'Giant observation wheel with panoramic city views',
    category: 'Observation',
    detailedDescription: 'The Singapore Flyer is a giant observation wheel and a prominent landmark of Singapore. Standing at 165 meters tall, it was the world\'s tallest Ferris wheel when it opened in 2008, a title it held until 2014. The wheel features 28 air-conditioned capsules, each able to accommodate up to 28 passengers. A complete rotation takes approximately 30 minutes, offering stunning panoramic views of the Marina Bay area, the Singapore River, and on clear days, parts of Malaysia and Indonesia. The Singapore Flyer was designed by Arup Australia and DP Architects. The structure\'s design was inspired by the Buddhist prayer wheel and the Chinese philosophy of yin and yang. The observation wheel has become an iconic part of Singapore\'s skyline and a popular tourist attraction, offering dining experiences and special event packages within its capsules.',
    photos: [
      'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
      'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800'
    ],
    historicalInfo: 'Opened in 2008, the Singapore Flyer stood at 165 meters and was the world\'s tallest Ferris wheel until 2014. It offers spectacular views of the city and surrounding regions.',
    yearBuilt: '2008',
    architect: 'DP Architects, Arup Australia',
    translations: {
      en: {
        name: 'Singapore Flyer',
        narration: 'Welcome to the Singapore Flyer, one of the world\'s largest observation wheels. Enjoy breathtaking 360-degree views of Singapore and beyond from 165 meters above ground.',
        description: 'Giant observation wheel with panoramic city views',
        historicalInfo: 'Opened in 2008, the Singapore Flyer stood at 165 meters and was the world\'s tallest Ferris wheel until 2014. It offers spectacular views of the city and surrounding regions.'
      },
      ko: {
        name: '싱가포르 플라이어',
        narration: '세계에서 가장 큰 관람차 중 하나인 싱가포르 플라이어에 오신 것을 환영합니다. 지상 165미터 높이에서 싱가포르와 그 너머의 숨막히는 360도 전망을 즐기세요.',
        description: '파노라마 도시 전망을 제공하는 거대한 관람차',
        historicalInfo: '2008년에 개장한 싱가포르 플라이어는 높이 165미터로 2014년까지 세계에서 가장 높은 관람차였습니다. 도시와 주변 지역의 장관을 이루는 전망을 제공합니다.'
      }
    }
  },
  {
    id: 'chinatown-heritage-centre',
    cityId: 'singapore',
    name: 'Chinatown Heritage Centre',
    lat: 1.283611,
    lng: 103.844167,
    radius: 50,
    narration: 'Welcome to the Chinatown Heritage Centre, a museum that brings to life the immigrant experience of early Chinese settlers in Singapore. Step back in time and discover the stories of hardship and triumph.',
    description: 'Museum showcasing early Chinese immigrant life',
    category: 'Museum & Heritage',
    detailedDescription: 'The Chinatown Heritage Centre is located in three beautifully restored shophouses along Pagoda Street in the heart of Singapore\'s Chinatown. The museum offers an intimate glimpse into the lives of early Chinese immigrants who came to Singapore in the 19th and early 20th centuries. Through meticulously recreated living spaces, authentic artifacts, and interactive exhibits, visitors can experience the cramped living conditions, toilets shared by multiple families, and the daily struggles faced by these pioneers. The centre showcases traditional trades such as tailor shops, provision stores, and Chinese medicine halls. Personal stories and oral histories bring to life the experiences of coolies, samsui women, and families who built Singapore\'s Chinatown. The museum spans three levels, each depicting different aspects of immigrant life from arrival to settlement and community building. It provides valuable historical context for understanding Singapore\'s multicultural heritage and the resilience of its founding communities.',
    photos: [
      'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800',
      'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800'
    ],
    historicalInfo: 'Opened in 2008, the Chinatown Heritage Centre is housed in three restored shophouses and documents the lives of early Chinese immigrants to Singapore during the colonial period.',
    yearBuilt: '2008',
    architect: 'Restoration by Singapore Tourism Board',
    translations: {
      en: {
        name: 'Chinatown Heritage Centre',
        narration: 'Welcome to the Chinatown Heritage Centre, a museum that brings to life the immigrant experience of early Chinese settlers in Singapore. Step back in time and discover the stories of hardship and triumph.',
        description: 'Museum showcasing early Chinese immigrant life',
        historicalInfo: 'Opened in 2008, the Chinatown Heritage Centre is housed in three restored shophouses and documents the lives of early Chinese immigrants to Singapore during the colonial period.',
        yearBuilt: '2008',
        architect: 'Restoration by Singapore Tourism Board'
      },
      it: {
        name: 'Centro del Patrimonio di Chinatown',
        narration: 'Benvenuto al Centro del Patrimonio di Chinatown, un museo che dà vita all\'esperienza degli immigrati dei primi coloni cinesi a Singapore. Fai un passo indietro nel tempo e scopri le storie di difficoltà e trionfo.',
        description: 'Museo che mostra la vita dei primi immigrati cinesi',
        historicalInfo: 'Aperto nel 2008, il Centro del Patrimonio di Chinatown è ospitato in tre shophouse restaurate e documenta la vita dei primi immigrati cinesi a Singapore durante il periodo coloniale.',
        yearBuilt: '2008',
        architect: 'Restauro dell\'Ente del Turismo di Singapore'
      },
      ko: {
        name: '차이나타운 헤리티지 센터',
        narration: '초기 중국인 정착민들의 이민 경험을 생생하게 재현한 박물관인 차이나타운 헤리티지 센터에 오신 것을 환영합니다. 시간을 거슬러 올라가 고난과 승리의 이야기를 발견하세요.',
        description: '초기 중국 이민자 생활을 보여주는 박물관',
        historicalInfo: '2008년에 개관한 차이나타운 헤리티지 센터는 복원된 세 개의 샵하우스에 자리하고 있으며 식민지 시대 싱가포르의 초기 중국 이민자들의 삶을 기록합니다.',
        yearBuilt: '2008',
        architect: '싱가포르 관광청 복원'
      }
    }
  },
  {
    id: 'national-museum-singapore',
    cityId: 'singapore',
    name: 'National Museum of Singapore',
    lat: 1.296667,
    lng: 103.848611,
    radius: 70,
    narration: 'Welcome to the National Museum of Singapore, the country\'s oldest museum. This iconic institution houses extensive collections that tell the story of Singapore\'s history and culture.',
    description: 'Singapore\'s oldest museum with rich historical collections',
    category: 'Museum',
    detailedDescription: 'The National Museum of Singapore is the oldest museum in the country, with its history dating back to 1887 when it was established as the Raffles Library and Museum. The museum building itself is an architectural landmark, blending Neo-Classical and Modern architectural elements, with its distinctive glass rotunda being a striking modern addition to the classical structure. The museum\'s permanent galleries are divided into two sections: the Singapore History Gallery, which traces 700 years of Singapore\'s history through multimedia presentations and rare artifacts, and the Singapore Living Galleries, which explore Singaporean identity through food, fashion, film, and photography. The museum houses significant collections including the William Farquhar Collection of Natural History Drawings, jade artifacts from the Tang Shipwreck, and the Singapore Stone fragment. The museum regularly hosts special exhibitions, performances, and cultural programs, making it a vibrant cultural hub in the heart of Singapore.',
    photos: [
      'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
      'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800'
    ],
    historicalInfo: 'Established in 1887 as the Raffles Library and Museum, it is Singapore\'s oldest museum. The building underwent major renovation and reopened in 2006 with modern exhibition spaces.',
    yearBuilt: '1887',
    architect: 'Original: Henry McCallum, Renovation: W Architects',
    translations: {
      en: {
        name: 'National Museum of Singapore',
        narration: 'Welcome to the National Museum of Singapore, the country\'s oldest museum. This iconic institution houses extensive collections that tell the story of Singapore\'s history and culture.',
        description: 'Singapore\'s oldest museum with rich historical collections',
        historicalInfo: 'Established in 1887 as the Raffles Library and Museum, it is Singapore\'s oldest museum. The building underwent major renovation and reopened in 2006 with modern exhibition spaces.',
        yearBuilt: '1887',
        architect: 'Original: Henry McCallum, Renovation: W Architects'
      },
      it: {
        name: 'Museo Nazionale di Singapore',
        narration: 'Benvenuto al Museo Nazionale di Singapore, il museo più antico del paese. Questa istituzione iconica ospita vaste collezioni che raccontano la storia e la cultura di Singapore.',
        description: 'Il museo più antico di Singapore con ricche collezioni storiche',
        historicalInfo: 'Fondato nel 1887 come Raffles Library and Museum, è il museo più antico di Singapore. L\'edificio ha subito una grande ristrutturazione ed è stato riaperto nel 2006 con spazi espositivi moderni.',
        yearBuilt: '1887',
        architect: 'Originale: Henry McCallum, Ristrutturazione: W Architects'
      },
      ko: {
        name: '싱가포르 국립 박물관',
        narration: '싱가포르에서 가장 오래된 박물관인 싱가포르 국립 박물관에 오신 것을 환영합니다. 이 상징적인 기관은 싱가포르의 역사와 문화를 이야기하는 광범위한 컬렉션을 소장하고 있습니다.',
        description: '풍부한 역사 컬렉션을 가진 싱가포르에서 가장 오래된 박물관',
        historicalInfo: '1887년 래플스 도서관 및 박물관으로 설립되어 싱가포르에서 가장 오래된 박물관입니다. 건물은 대대적인 개보수를 거쳐 2006년 현대적인 전시 공간으로 재개관했습니다.',
        yearBuilt: '1887',
        architect: '원작: 헨리 맥칼럼, 리노베이션: W Architects'
      }
    }
  },
  {
    id: 'sentosa-island',
    cityId: 'singapore',
    name: 'Sentosa Island',
    lat: 1.249404,
    lng: 103.830321,
    radius: 100,
    narration: 'Welcome to Sentosa Island, Singapore\'s premier island resort destination. This tropical paradise offers beaches, theme parks, attractions, and entertainment for the whole family.',
    description: 'Island resort with beaches, attractions, and entertainment',
    category: 'Island Resort',
    detailedDescription: 'Sentosa Island, meaning "peace and tranquility" in Malay, is a resort island located off Singapore\'s southern coast. Once a British military fortress called Pulau Blakang Mati (meaning "island of death from behind"), it was transformed into a tourism destination in the 1970s. The 500-hectare island is connected to the mainland by a causeway and accessible by monorail, cable car, or road. Sentosa features pristine beaches including Siloso, Palawan, and Tanjong Beach, each offering water sports and beachfront dining. Major attractions include Universal Studios Singapore, S.E.A. Aquarium, Adventure Cove Waterpark, and the iconic Merlion statue. The island also houses luxury resorts, golf courses, a casino, and historical sites like Fort Siloso. The Sentosa Boardwalk offers scenic waterfront views, while the Imbiah Lookout area provides attractions like the Sentosa 4D AdventureLand and Madame Tussauds. The island hosts various events and shows, making it a year-round entertainment destination.',
    photos: [
      'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800',
      'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800'
    ],
    historicalInfo: 'Once a military fortress, Sentosa was redeveloped as a tourist destination in the 1970s. It has since become Singapore\'s premier integrated resort island with world-class attractions.',
    yearBuilt: '1972',
    architect: 'Sentosa Development Corporation',
    translations: {
      en: {
        name: 'Sentosa Island',
        narration: 'Welcome to Sentosa Island, Singapore\'s premier island resort destination. This tropical paradise offers beaches, theme parks, attractions, and entertainment for the whole family.',
        description: 'Island resort with beaches, attractions, and entertainment',
        historicalInfo: 'Once a military fortress, Sentosa was redeveloped as a tourist destination in the 1970s. It has since become Singapore\'s premier integrated resort island with world-class attractions.',
        yearBuilt: '1972',
        architect: 'Sentosa Development Corporation'
      },
      it: {
        name: 'Isola di Sentosa',
        narration: 'Benvenuto all\'Isola di Sentosa, la principale destinazione resort di Singapore. Questo paradiso tropicale offre spiagge, parchi a tema, attrazioni e intrattenimento per tutta la famiglia.',
        description: 'Resort insulare con spiagge, attrazioni e intrattenimento',
        historicalInfo: 'Un tempo fortezza militare, Sentosa è stata riconvertita come destinazione turistica negli anni \'70. Da allora è diventata la principale isola resort integrata di Singapore con attrazioni di livello mondiale.',
        yearBuilt: '1972',
        architect: 'Sentosa Development Corporation'
      },
      ko: {
        name: '센토사 섬',
        narration: '싱가포르 최고의 섬 리조트 목적지인 센토사 섬에 오신 것을 환영합니다. 이 열대 낙원은 온 가족을 위한 해변, 테마파크, 명소, 엔터테인먼트를 제공합니다.',
        description: '해변, 명소, 엔터테인먼트를 갖춘 섬 리조트',
        historicalInfo: '한때 군사 요새였던 센토사는 1970년대에 관광지로 재개발되었습니다. 이후 세계적인 수준의 명소를 갖춘 싱가포르 최고의 통합 리조트 섬이 되었습니다.',
        yearBuilt: '1972',
        architect: '센토사 개발 공사'
      }
    }
  },
  
  // Penang, Malaysia landmarks
  {
    id: 'kek-lok-si-temple',
    cityId: 'penang',
    name: 'Kek Lok Si Temple',
    lat: 5.399167,
    lng: 100.2725,
    radius: 70,
    narration: 'Welcome to Kek Lok Si Temple, the largest Buddhist temple in Southeast Asia. This magnificent temple complex features stunning architecture and offers panoramic views of Penang.',
    description: 'Largest Buddhist temple in Southeast Asia',
    category: 'Religious',
    detailedDescription: 'Kek Lok Si Temple, or the Temple of Supreme Bliss, is a Buddhist temple complex located in Air Itam, Penang. It is the largest Buddhist temple in Southeast Asia and one of the key attractions in Penang. Construction began in 1891 and took over 20 years to complete. The temple complex features a seven-tier pagoda called the Pagoda of Rama VI, which combines Chinese, Thai, and Burmese architectural styles. The temple sits on a hill, offering breathtaking views of Georgetown and Penang Island. The main attraction is the towering 36.5-meter bronze statue of Kuan Yin, the Goddess of Mercy, completed in 2002. The temple is especially beautiful during Chinese New Year when it is decorated with thousands of lanterns and lights. The complex includes multiple halls, pavilions, and ponds filled with tortoises.',
    photos: [
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800',
      'https://images.unsplash.com/photo-1595506040715-1e3f5dc50d4b?w=800'
    ],
    historicalInfo: 'Construction began in 1891 and took over 20 years to complete. It is the largest Buddhist temple in Southeast Asia and features a blend of Chinese, Thai, and Burmese architectural styles.',
    yearBuilt: '1891-1911',
    architect: 'Beow Lean',
    translations: {
      en: {
        name: 'Kek Lok Si Temple',
        narration: 'Welcome to Kek Lok Si Temple, the largest Buddhist temple in Southeast Asia. This magnificent temple complex features stunning architecture and offers panoramic views of Penang.',
        description: 'Largest Buddhist temple in Southeast Asia',
        historicalInfo: 'Construction began in 1891 and took over 20 years to complete. It is the largest Buddhist temple in Southeast Asia and features a blend of Chinese, Thai, and Burmese architectural styles.'
      },
      ko: {
        name: '켁 록 시 사원',
        narration: '동남아시아에서 가장 큰 불교 사원인 켁 록 시 사원에 오신 것을 환영합니다. 이 웅장한 사원 복합체는 놀라운 건축물을 특징으로 하며 페낭의 파노라마 전망을 제공합니다.',
        description: '동남아시아 최대의 불교 사원',
        historicalInfo: '1891년에 건설이 시작되어 완공까지 20년 이상이 걸렸습니다. 중국, 태국, 미얀마 건축 양식이 혼합된 동남아시아 최대의 불교 사원입니다.'
      }
    }
  },
  {
    id: 'fort-cornwallis',
    cityId: 'penang',
    name: 'Fort Cornwallis',
    lat: 5.421667,
    lng: 100.345,
    radius: 60,
    narration: 'Welcome to Fort Cornwallis, the largest standing fort in Malaysia. Built in the 18th century, this historic fortress marks the spot where Captain Francis Light first landed in Penang.',
    description: 'Largest standing British fort in Malaysia',
    category: 'Historical',
    detailedDescription: 'Fort Cornwallis is a star-shaped fort located in Georgetown, Penang. Built by the British East India Company in the late 18th century, it is the largest standing fort in Malaysia. The fort was named after Charles Cornwallis, the Governor-General of Bengal. Captain Francis Light landed at this site in 1786 and established the British colony on Penang Island. The fort was originally built with wood and nibong palms but was later rebuilt with convict labor using bricks between 1808 and 1810. Today, the fort houses several historical artifacts including cannons, ammunition storage, a chapel, and living quarters. The most famous cannon is Seri Rambai, a Dutch cannon captured in the 18th century. Visitors can explore the fort grounds, view historical exhibits, and enjoy the waterfront location with views of the harbor.',
    photos: [
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800',
      'https://images.unsplash.com/photo-1595506040715-1e3f5dc50d4b?w=800'
    ],
    historicalInfo: 'Built in 1786 by Captain Francis Light, Fort Cornwallis marks the birthplace of British Penang. It was originally constructed with wood and later rebuilt with brick between 1808-1810.',
    yearBuilt: '1786',
    architect: 'British East India Company',
    translations: {
      en: {
        name: 'Fort Cornwallis',
        narration: 'Welcome to Fort Cornwallis, the largest standing fort in Malaysia. Built in the 18th century, this historic fortress marks the spot where Captain Francis Light first landed in Penang.',
        description: 'Largest standing British fort in Malaysia',
        historicalInfo: 'Built in 1786 by Captain Francis Light, Fort Cornwallis marks the birthplace of British Penang. It was originally constructed with wood and later rebuilt with brick between 1808-1810.'
      },
      ko: {
        name: '포트 콘월리스',
        narration: '말레이시아에서 가장 큰 현존하는 요새인 포트 콘월리스에 오신 것을 환영합니다. 18세기에 건설된 이 역사적인 요새는 프랜시스 라이트 선장이 페낭에 처음 상륙한 장소를 표시합니다.',
        description: '말레이시아에서 가장 큰 현존하는 영국 요새',
        historicalInfo: '1786년 프랜시스 라이트 선장이 건설한 포트 콘월리스는 영국령 페낭의 탄생지를 표시합니다. 원래 나무로 건설되었으며 1808-1810년 사이에 벽돌로 재건되었습니다.'
      }
    }
  },
  {
    id: 'khoo-kongsi',
    cityId: 'penang',
    name: 'Khoo Kongsi',
    lat: 5.416389,
    lng: 100.336667,
    radius: 50,
    narration: 'Welcome to Khoo Kongsi, one of the most ornate Chinese clan houses in Southeast Asia. This magnificent temple showcases exquisite craftsmanship and rich Chinese heritage.',
    description: 'Ornate Chinese clan house and temple',
    category: 'Cultural Heritage',
    detailedDescription: 'Khoo Kongsi is an ornate Chinese clan house temple located in Georgetown, Penang. It is one of the most distinctive Chinese clan associations in Malaysia and Southeast Asia. Built by the Khoo clan in 1851 and completed in 1906, the kongsi is renowned for its elaborate architecture, intricate carvings, and detailed paintings. The main building features a dragon-adorned roof, colorful murals, and gold-leaf decorations. The temple was built to honor the Khoo ancestors and served as a meeting place for clan members. The complex includes the main temple, an opera stage, administrative offices, and rows of terrace houses where clan members once lived. Khoo Kongsi is part of the UNESCO World Heritage Site of Georgetown and represents the peak of Chinese architectural craftsmanship outside of China.',
    photos: [
      'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800',
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800'
    ],
    historicalInfo: 'Built in 1851 and completed in 1906, Khoo Kongsi is one of the most elaborate Chinese clan houses in Southeast Asia, featuring intricate carvings and exquisite architectural details.',
    yearBuilt: '1851-1906',
    architect: 'Khoo Clan',
    translations: {
      en: {
        name: 'Khoo Kongsi',
        narration: 'Welcome to Khoo Kongsi, one of the most ornate Chinese clan houses in Southeast Asia. This magnificent temple showcases exquisite craftsmanship and rich Chinese heritage.',
        description: 'Ornate Chinese clan house and temple',
        historicalInfo: 'Built in 1851 and completed in 1906, Khoo Kongsi is one of the most elaborate Chinese clan houses in Southeast Asia, featuring intricate carvings and exquisite architectural details.'
      },
      ko: {
        name: '쿠 콩시',
        narration: '동남아시아에서 가장 화려한 중국 씨족 회관 중 하나인 쿠 콩시에 오신 것을 환영합니다. 이 웅장한 사원은 정교한 장인 정신과 풍부한 중국 유산을 보여줍니다.',
        description: '화려한 중국 씨족 회관 및 사원',
        historicalInfo: '1851년에 건설되어 1906년에 완공된 쿠 콩시는 복잡한 조각과 정교한 건축적 세부 사항을 특징으로 하는 동남아시아에서 가장 정교한 중국 씨족 회관 중 하나입니다.'
      }
    }
  },
  {
    id: 'penang-hill',
    cityId: 'penang',
    name: 'Penang Hill',
    lat: 5.422778,
    lng: 100.268611,
    radius: 80,
    narration: 'Welcome to Penang Hill, a cool retreat offering spectacular views of Penang Island. Take the funicular railway to the summit and enjoy the refreshing mountain air.',
    description: 'Scenic hilltop retreat with funicular railway',
    category: 'Nature & Viewpoint',
    detailedDescription: 'Penang Hill, also known as Bukit Bendera, is a hill resort located in the Air Itam area of Penang. Standing at 821 meters above sea level, it is the oldest British hill station in Southeast Asia, established in the late 18th century. The hill provides a cool escape from the tropical heat, with temperatures about 5°C cooler than at sea level. Visitors reach the summit via the Penang Hill Funicular Railway, one of the steepest and longest funicular systems in the world. At the top, visitors can enjoy panoramic views of Georgetown, the coastline, and on clear days, mainland Malaysia. The summit features colonial bungalows, gardens, a mosque, a Hindu temple, a bird park, and various restaurants. The hill is also home to diverse flora and fauna, including rare plants and bird species. The cool climate makes it a popular spot for hiking and nature walks.',
    photos: [
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800',
      'https://images.unsplash.com/photo-1595506040715-1e3f5dc50d4b?w=800'
    ],
    historicalInfo: 'Established in the late 18th century, Penang Hill is the oldest British hill station in Southeast Asia. The funicular railway was opened in 1923 and modernized in 2011.',
    yearBuilt: '1790s',
    architect: 'British Colonial Administration',
    translations: {
      en: {
        name: 'Penang Hill',
        narration: 'Welcome to Penang Hill, a cool retreat offering spectacular views of Penang Island. Take the funicular railway to the summit and enjoy the refreshing mountain air.',
        description: 'Scenic hilltop retreat with funicular railway',
        historicalInfo: 'Established in the late 18th century, Penang Hill is the oldest British hill station in Southeast Asia. The funicular railway was opened in 1923 and modernized in 2011.'
      },
      ko: {
        name: '페낭 힐',
        narration: '페낭 섬의 장관을 이루는 전망을 제공하는 시원한 휴양지인 페낭 힐에 오신 것을 환영합니다. 푸니쿨라 철도를 타고 정상에 올라 상쾌한 산악 공기를 즐기세요.',
        description: '푸니쿨라 철도가 있는 경치 좋은 언덕 휴양지',
        historicalInfo: '18세기 후반에 설립된 페낭 힐은 동남아시아에서 가장 오래된 영국 언덕 휴양지입니다. 푸니쿨라 철도는 1923년에 개통되어 2011년에 현대화되었습니다.'
      }
    }
  },
  {
    id: 'george-town-unesco-site',
    cityId: 'penang',
    name: 'George Town UNESCO Site',
    lat: 5.414167,
    lng: 100.328611,
    radius: 100,
    narration: 'Welcome to George Town UNESCO World Heritage Site, a living testimony to the multicultural heritage of Asia and Europe. This historic city showcases exceptional colonial and Asian architecture.',
    description: 'UNESCO World Heritage historic city center',
    category: 'UNESCO Heritage',
    detailedDescription: 'George Town was inscribed as a UNESCO World Heritage Site in 2008, recognized for its unique architectural and cultural townscape without parallel anywhere in East and Southeast Asia. The historic city reflects the coming together of British colonial architecture and traditional Chinese and Indian influences, creating a distinct cultural and architectural character. The site encompasses over 1,700 heritage buildings, including pre-war shophouses, temples, mosques, churches, and clan houses. Notable areas include the Armenian Street heritage zone, Little India, and the Clan Jetties - unique waterfront settlements built on stilts. The city is famous for its vibrant street art, including works by Lithuanian artist Ernest Zacharevic. George Town\'s culinary scene is equally celebrated, representing a fusion of Malay, Chinese, Indian, and Peranakan cuisines. The UNESCO recognition has helped preserve the city\'s unique character while promoting sustainable tourism and cultural conservation.',
    photos: [
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800',
      'https://images.unsplash.com/photo-1595506040715-1e3f5dc50d4b?w=800'
    ],
    historicalInfo: 'George Town was inscribed as a UNESCO World Heritage Site in 2008 for its unique blend of British colonial and Asian architecture, representing a multicultural trading town in East and Southeast Asia.',
    yearBuilt: '1786',
    architect: 'Captain Francis Light and various colonial architects',
    translations: {
      en: {
        name: 'George Town UNESCO Site',
        narration: 'Welcome to George Town UNESCO World Heritage Site, a living testimony to the multicultural heritage of Asia and Europe. This historic city showcases exceptional colonial and Asian architecture.',
        description: 'UNESCO World Heritage historic city center',
        historicalInfo: 'George Town was inscribed as a UNESCO World Heritage Site in 2008 for its unique blend of British colonial and Asian architecture, representing a multicultural trading town in East and Southeast Asia.',
        yearBuilt: '1786',
        architect: 'Captain Francis Light and various colonial architects'
      },
      it: {
        name: 'Sito UNESCO di George Town',
        narration: 'Benvenuto al Sito Patrimonio Mondiale dell\'UNESCO di George Town, una testimonianza vivente del patrimonio multiculturale dell\'Asia e dell\'Europa. Questa città storica presenta un\'eccezionale architettura coloniale e asiatica.',
        description: 'Centro storico cittadino patrimonio mondiale UNESCO',
        historicalInfo: 'George Town è stata iscritta come Sito Patrimonio Mondiale dell\'UNESCO nel 2008 per la sua miscela unica di architettura coloniale britannica e asiatica, rappresentando una città commerciale multiculturale nell\'Asia orientale e sud-orientale.',
        yearBuilt: '1786',
        architect: 'Capitano Francis Light e vari architetti coloniali'
      },
      ko: {
        name: '조지타운 유네스코 유적지',
        narration: '아시아와 유럽의 다문화 유산을 보여주는 살아있는 증거인 조지타운 유네스코 세계유산에 오신 것을 환영합니다. 이 역사적인 도시는 뛰어난 식민지 및 아시아 건축을 선보입니다.',
        description: '유네스코 세계유산 역사적 도심',
        historicalInfo: '조지타운은 영국 식민지와 아시아 건축의 독특한 혼합으로 동아시아와 동남아시아의 다문화 무역 도시를 대표하여 2008년 유네스코 세계유산으로 등재되었습니다.',
        yearBuilt: '1786',
        architect: '프랜시스 라이트 대위와 여러 식민지 건축가'
      }
    }
  },
  {
    id: 'pinang-peranakan-mansion',
    cityId: 'penang',
    name: 'Pinang Peranakan Mansion',
    lat: 5.420278,
    lng: 100.338611,
    radius: 50,
    narration: 'Welcome to the Pinang Peranakan Mansion, a museum showcasing the opulent lifestyle of the Peranakan community. This restored mansion displays exquisite antiques and cultural treasures.',
    description: 'Museum of Peranakan heritage and culture',
    category: 'Museum & Heritage',
    detailedDescription: 'The Pinang Peranakan Mansion is a museum that provides an insight into the unique Peranakan culture, also known as Straits Chinese or Baba-Nyonya culture. Housed in a restored 19th-century mansion, the museum showcases over 1,000 pieces of antiques and collectibles, including intricate Chinese carved wooden panels, mother-of-pearl inlaid furniture, gold-embroidered textiles, and Italian floor tiles. The Peranakan community emerged from marriages between Chinese immigrants and local Malays, creating a distinct culture that blends Chinese, Malay, and European influences. The mansion recreates the lavish lifestyle of a wealthy Peranakan family, with beautifully furnished rooms including a reception hall, ancestral altar, bridal chamber, and dining area. The collection includes rare Peranakan porcelain, jewelry, traditional costumes, and household items. The mansion serves as an important cultural institution preserving and promoting the rich heritage of Penang\'s Peranakan community.',
    photos: [
      'https://images.unsplash.com/photo-1566127444979-b3d2b64d1b23?w=800',
      'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800',
      'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800',
      'https://images.unsplash.com/photo-1555217851-85fd5a8fa4cf?w=800',
      'https://images.unsplash.com/photo-1523428096881-5c6f16d8915b?w=800',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      'https://images.unsplash.com/photo-1523509433743-6f42a58221df?w=800'
    ],
    historicalInfo: 'Built in the late 19th century and restored as a museum, the mansion showcases the lavish lifestyle and unique cultural heritage of Penang\'s Peranakan community.',
    yearBuilt: '1890s',
    architect: 'Traditional Peranakan architecture',
    translations: {
      en: {
        name: 'Pinang Peranakan Mansion',
        narration: 'Welcome to the Pinang Peranakan Mansion, a museum showcasing the opulent lifestyle of the Peranakan community. This restored mansion displays exquisite antiques and cultural treasures.',
        description: 'Museum of Peranakan heritage and culture',
        historicalInfo: 'Built in the late 19th century and restored as a museum, the mansion showcases the lavish lifestyle and unique cultural heritage of Penang\'s Peranakan community.',
        yearBuilt: '1890s',
        architect: 'Traditional Peranakan architecture'
      },
      it: {
        name: 'Pinang Peranakan Mansion',
        narration: 'Benvenuto alla Pinang Peranakan Mansion, un museo che mostra lo stile di vita opulento della comunità Peranakan. Questa villa restaurata espone squisiti oggetti d\'antiquariato e tesori culturali.',
        description: 'Museo del patrimonio e della cultura Peranakan',
        historicalInfo: 'Costruita alla fine del XIX secolo e restaurata come museo, la villa mostra lo stile di vita sontuoso e l\'unico patrimonio culturale della comunità Peranakan di Penang.',
        yearBuilt: '1890',
        architect: 'Architettura tradizionale Peranakan'
      },
      ko: {
        name: '피낭 페라나칸 맨션',
        narration: '페라나칸 공동체의 호화로운 생활 방식을 보여주는 박물관인 피낭 페라나칸 맨션에 오신 것을 환영합니다. 이 복원된 저택은 정교한 골동품과 문화 유산을 전시합니다.',
        description: '페라나칸 유산과 문화 박물관',
        historicalInfo: '19세기 후반에 건설되어 박물관으로 복원된 이 저택은 페낭 페라나칸 공동체의 사치스러운 생활 방식과 독특한 문화 유산을 보여줍니다.',
        yearBuilt: '1890년대',
        architect: '전통 페라나칸 건축'
      }
    }
  },
  {
    id: 'penang-national-park',
    cityId: 'penang',
    name: 'Penang National Park',
    lat: 5.46,
    lng: 100.203333,
    radius: 100,
    narration: 'Welcome to Penang National Park, the smallest national park in the world yet rich in biodiversity. This protected area features pristine beaches, jungle trails, and diverse wildlife.',
    description: 'Smallest national park with beaches and rainforest',
    category: 'Nature & Park',
    detailedDescription: 'Penang National Park, established in 2003, is the smallest national park in the world, covering only 2,562 hectares. Despite its compact size, the park boasts remarkable biodiversity with over 417 flora species and 143 fauna species, including the critically endangered green sea turtle and hawksbill turtle. The park features diverse ecosystems including dipterocarp forest, mangrove forest, coastal hill forest, and coral reefs. Popular trails lead to pristine beaches such as Monkey Beach (Teluk Duyung) and Turtle Beach (Pantai Kerachut), where turtle conservation efforts are ongoing. The Canopy Walkway, suspended 15 meters above ground, offers spectacular views of the forest and coastline. The park also houses Meromictic Lake, a rare natural phenomenon where fresh and saltwater layers don\'t mix. Visitors can engage in activities like hiking, wildlife watching, swimming, and participating in turtle conservation programs. The park represents an important conservation area protecting Penang\'s natural heritage.',
    photos: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      'https://images.unsplash.com/photo-1511497584788-876760111969?w=800',
      'https://images.unsplash.com/photo-1527934111143-f2c94c664e50?w=800',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800'
    ],
    historicalInfo: 'Established in 2003, Penang National Park is the smallest national park in the world but features rich biodiversity and important turtle conservation programs.',
    yearBuilt: '2003',
    architect: 'Department of Wildlife and National Parks',
    translations: {
      en: {
        name: 'Penang National Park',
        narration: 'Welcome to Penang National Park, the smallest national park in the world yet rich in biodiversity. This protected area features pristine beaches, jungle trails, and diverse wildlife.',
        description: 'Smallest national park with beaches and rainforest',
        historicalInfo: 'Established in 2003, Penang National Park is the smallest national park in the world but features rich biodiversity and important turtle conservation programs.',
        yearBuilt: '2003',
        architect: 'Department of Wildlife and National Parks'
      },
      it: {
        name: 'Parco Nazionale di Penang',
        narration: 'Benvenuto al Parco Nazionale di Penang, il parco nazionale più piccolo del mondo ma ricco di biodiversità. Quest\'area protetta presenta spiagge incontaminate, sentieri nella giungla e fauna diversificata.',
        description: 'Parco nazionale più piccolo con spiagge e foresta pluviale',
        historicalInfo: 'Istituito nel 2003, il Parco Nazionale di Penang è il parco nazionale più piccolo del mondo ma presenta una ricca biodiversità e importanti programmi di conservazione delle tartarughe.',
        yearBuilt: '2003',
        architect: 'Dipartimento della Fauna Selvatica e dei Parchi Nazionali'
      },
      ko: {
        name: '페낭 국립공원',
        narration: '세계에서 가장 작지만 생물 다양성이 풍부한 페낭 국립공원에 오신 것을 환영합니다. 이 보호 구역은 깨끗한 해변, 정글 트레일, 다양한 야생 동물을 특징으로 합니다.',
        description: '해변과 열대우림이 있는 가장 작은 국립공원',
        historicalInfo: '2003년에 설립된 페낭 국립공원은 세계에서 가장 작은 국립공원이지만 풍부한 생물 다양성과 중요한 거북이 보존 프로그램을 갖추고 있습니다.',
        yearBuilt: '2003',
        architect: '야생동물 및 국립공원부'
      }
    }
  },

  // Kuala Lumpur, Malaysia landmarks
  {
    id: 'petronas-towers',
    cityId: 'kuala-lumpur',
    name: 'Petronas Twin Towers',
    lat: 3.157764,
    lng: 101.711861,
    radius: 80,
    narration: 'Welcome to the Petronas Twin Towers, the iconic symbol of Malaysia. These magnificent twin skyscrapers stand at 452 meters tall and were the world\'s tallest buildings from 1998 to 2004.',
    description: 'World\'s tallest twin skyscrapers',
    category: 'Modern Architecture',
    detailedDescription: 'The Petronas Twin Towers, also known as Menara Berkembar Petronas, are twin skyscrapers in Kuala Lumpur that were the tallest buildings in the world from 1998 to 2004 and remain the world\'s tallest twin skyscrapers. Designed by Argentine-American architect César Pelli, the 88-story towers stand 451.9 meters tall. The towers feature a postmodern architectural style with Islamic art motifs that reflect Malaysia\'s Muslim heritage. Each tower floor plan is based on an eight-pointed star pattern created from overlapping squares and circles. The towers are connected by the Skybridge on the 41st and 42nd floors, the world\'s highest two-story bridge at the time. The 86th floor observation deck offers spectacular views of the city. The towers house the headquarters of Petronas, Malaysia\'s national petroleum corporation, as well as offices, a shopping mall (Suria KLCC), art gallery, concert hall, and a mosque.',
    photos: [
      'https://images.unsplash.com/photo-1533142266415-e011adf087e4?w=800',
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800',
      'https://images.unsplash.com/photo-1595506040715-1e3f5dc50d4b?w=800'
    ],
    historicalInfo: 'Completed in 1998, the Petronas Towers were designed by César Pelli and held the title of world\'s tallest buildings until 2004. They remain the world\'s tallest twin towers.',
    yearBuilt: '1998',
    architect: 'César Pelli',
    translations: {
      en: {
        name: 'Petronas Twin Towers',
        narration: 'Welcome to the Petronas Twin Towers, the iconic symbol of Malaysia. These magnificent twin skyscrapers stand at 452 meters tall and were the world\'s tallest buildings from 1998 to 2004.',
        description: 'World\'s tallest twin skyscrapers',
        historicalInfo: 'Completed in 1998, the Petronas Towers were designed by César Pelli and held the title of world\'s tallest buildings until 2004. They remain the world\'s tallest twin towers.'
      },
      ko: {
        name: '페트로나스 트윈 타워',
        narration: '말레이시아의 상징적인 심볼인 페트로나스 트윈 타워에 오신 것을 환영합니다. 이 웅장한 쌍둥이 마천루는 높이 452미터로 1998년부터 2004년까지 세계에서 가장 높은 건물이었습니다.',
        description: '세계에서 가장 높은 쌍둥이 마천루',
        historicalInfo: '1998년에 완공된 페트로나스 타워는 세사르 펠리가 설계했으며 2004년까지 세계에서 가장 높은 건물의 타이틀을 보유했습니다. 여전히 세계에서 가장 높은 쌍둥이 타워입니다.'
      }
    }
  },
  {
    id: 'batu-caves',
    cityId: 'kuala-lumpur',
    name: 'Batu Caves',
    lat: 3.237222,
    lng: 101.683889,
    radius: 70,
    narration: 'Welcome to Batu Caves, a limestone hill with a series of caves and cave temples. The site is dominated by the massive golden statue of Lord Murugan and features 272 colorful steps.',
    description: 'Sacred Hindu temple complex in limestone caves',
    category: 'Religious & Natural',
    detailedDescription: 'Batu Caves is a limestone hill with a series of caves and cave temples located in Gombak, Selangor, just north of Kuala Lumpur. The cave complex is one of the most popular Hindu shrines outside India and is dedicated to Lord Murugan. The site features a 42.7-meter tall golden statue of Lord Murugan at the entrance, the tallest statue of a Hindu deity in Malaysia and the third tallest statue of a Hindu deity in the world. Visitors must climb 272 colorful steps to reach the main Temple Cave, also known as Cathedral Cave, which is 100 meters high. The cave complex consists of three main caves and several smaller ones. The largest cave, the Temple Cave, houses several Hindu shrines beneath its high dome. During the annual Thaipusam festival, over 1.5 million pilgrims gather at Batu Caves. The caves are also home to a large colony of macaque monkeys that interact with visitors.',
    photos: [
      'https://images.unsplash.com/photo-1588083949404-c4f1ed1323b3?w=800',
      'https://images.unsplash.com/photo-1599639668273-8cdf4d6e4e64?w=800'
    ],
    historicalInfo: 'The caves have been used as a Hindu shrine for over 120 years. The golden statue of Lord Murugan was unveiled in 2006 and stands 42.7 meters tall.',
    yearBuilt: '1892',
    architect: 'Natural Formation, Hindu Temple by K. Thamboosamy Pillai',
    translations: {
      en: {
        name: 'Batu Caves',
        narration: 'Welcome to Batu Caves, a limestone hill with a series of caves and cave temples. The site is dominated by the massive golden statue of Lord Murugan and features 272 colorful steps.',
        description: 'Sacred Hindu temple complex in limestone caves',
        historicalInfo: 'The caves have been used as a Hindu shrine for over 120 years. The golden statue of Lord Murugan was unveiled in 2006 and stands 42.7 meters tall.'
      },
      ko: {
        name: '바투 동굴',
        narration: '일련의 동굴과 동굴 사원이 있는 석회암 언덕인 바투 동굴에 오신 것을 환영합니다. 이 장소는 거대한 금색 무루간 신 동상이 지배하고 있으며 272개의 다채로운 계단이 특징입니다.',
        description: '석회암 동굴의 신성한 힌두 사원 복합체',
        historicalInfo: '동굴은 120년 이상 힌두 신전으로 사용되어 왔습니다. 금색 무루간 신 동상은 2006년에 공개되었으며 높이 42.7미터입니다.'
      }
    }
  },
  {
    id: 'thean-hou-temple',
    cityId: 'kuala-lumpur',
    name: 'Thean Hou Temple',
    lat: 3.1225,
    lng: 101.686111,
    radius: 70,
    narration: 'Welcome to Thean Hou Temple, one of the oldest and largest Chinese temples in Southeast Asia. This six-tiered temple is dedicated to the Chinese sea goddess Mazu and showcases traditional Chinese architecture.',
    description: 'Six-tiered Chinese temple dedicated to goddess Mazu',
    category: 'Religious',
    detailedDescription: 'The Thean Hou Temple, completed in 1987, is one of the oldest and largest temples in Southeast Asia. Perched atop Robson Heights, the temple is dedicated to Thean Hou, the Heavenly Mother and goddess of the sea. The temple was built by the Hainanese community of Kuala Lumpur and covers 1.67 acres. The six-tiered temple combines elements of Buddhism, Taoism, and Confucianism, reflecting the syncretic nature of Chinese folk religion. The main prayer hall features ornate pillars, intricate carvings, and beautiful murals depicting Chinese legends. The temple complex includes a medicinal herb garden, souvenir shop, and a tortoise pond believed to bring longevity. The rooftop offers panoramic views of Kuala Lumpur cityscape. The temple is especially vibrant during Chinese festivals, particularly during Chinese New Year and the Mid-Autumn Festival, when it is decorated with thousands of lanterns. The architectural beauty, spiritual significance, and cultural importance make Thean Hou Temple a must-visit landmark.',
    photos: [
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800',
      'https://images.unsplash.com/photo-1595506040715-1e3f5dc50d4b?w=800'
    ],
    historicalInfo: 'Completed in 1987 by the Hainanese community, Thean Hou Temple is one of the oldest and largest Chinese temples in Southeast Asia, dedicated to the sea goddess Mazu.',
    yearBuilt: '1987',
    architect: 'Hainanese Community of Kuala Lumpur',
    translations: {
      en: {
        name: 'Thean Hou Temple',
        narration: 'Welcome to Thean Hou Temple, one of the oldest and largest Chinese temples in Southeast Asia. This six-tiered temple is dedicated to the Chinese sea goddess Mazu and showcases traditional Chinese architecture.',
        description: 'Six-tiered Chinese temple dedicated to goddess Mazu',
        historicalInfo: 'Completed in 1987 by the Hainanese community, Thean Hou Temple is one of the oldest and largest Chinese temples in Southeast Asia, dedicated to the sea goddess Mazu.',
        yearBuilt: '1987',
        architect: 'Hainanese Community of Kuala Lumpur'
      },
      it: {
        name: 'Tempio Thean Hou',
        narration: 'Benvenuto al Tempio Thean Hou, uno dei templi cinesi più antichi e grandi del Sud-est asiatico. Questo tempio a sei livelli è dedicato alla dea del mare cinese Mazu e mostra l\'architettura tradizionale cinese.',
        description: 'Tempio cinese a sei livelli dedicato alla dea Mazu',
        historicalInfo: 'Completato nel 1987 dalla comunità Hainanese, il Tempio Thean Hou è uno dei templi cinesi più antichi e grandi del Sud-est asiatico, dedicato alla dea del mare Mazu.',
        yearBuilt: '1987',
        architect: 'Comunità Hainanese di Kuala Lumpur'
      },
      ko: {
        name: '티안 호우 사원',
        narration: '동남아시아에서 가장 오래되고 큰 중국 사원 중 하나인 티안 호우 사원에 오신 것을 환영합니다. 이 6층 사원은 중국 바다의 여신 마조에게 헌정되었으며 전통적인 중국 건축을 보여줍니다.',
        description: '여신 마조에게 헌정된 6층 중국 사원',
        historicalInfo: '1987년 하이난 공동체에 의해 완공된 티안 호우 사원은 바다의 여신 마조에게 헌정된 동남아시아에서 가장 오래되고 큰 중국 사원 중 하나입니다.',
        yearBuilt: '1987',
        architect: '쿠알라룸푸르 하이난 공동체'
      }
    }
  },
  {
    id: 'kl-tower',
    cityId: 'kuala-lumpur',
    name: 'KL Tower',
    lat: 3.152778,
    lng: 101.703611,
    radius: 60,
    narration: 'Welcome to KL Tower, the seventh tallest telecommunication tower in the world. Rising 421 meters above sea level, this iconic tower offers spectacular 360-degree views of Kuala Lumpur.',
    description: 'Iconic telecommunication tower with observation deck',
    category: 'Observation & Modern Architecture',
    detailedDescription: 'The Kuala Lumpur Tower, officially known as Menara Kuala Lumpur, was completed in 1996 and stands as the seventh tallest telecommunication tower in the world at 421 meters. Built on Bukit Nanas (Pineapple Hill), the tower\'s base sits 93 meters above sea level, giving it a total height of 421 meters. The tower was designed by architect Kumpulan Senireka Sdn Bhd and constructed over four years. The tower serves as a telecommunications hub for the city and features an observation deck at 276 meters that offers breathtaking panoramic views of Kuala Lumpur and beyond. The Sky Deck at 300 meters provides an even more spectacular viewing experience with an open-air platform. The tower also houses a revolving restaurant, Atmosphere 360, which completes a full rotation every hour. At the base of the tower is an amphitheater, upside-down house attraction, and mini zoo. The tower is built within the oldest gazetted forest reserve in Malaysia, the Bukit Nanas Forest Reserve. At night, the tower is beautifully illuminated and serves as a prominent landmark in the city\'s skyline.',
    photos: [
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800',
      'https://images.unsplash.com/photo-1533142266415-e011adf087e4?w=800'
    ],
    historicalInfo: 'Completed in 1996, KL Tower stands at 421 meters and is the seventh tallest telecommunication tower in the world. It serves as both a telecommunications hub and tourist attraction.',
    yearBuilt: '1996',
    architect: 'Kumpulan Senireka Sdn Bhd',
    translations: {
      en: {
        name: 'KL Tower',
        narration: 'Welcome to KL Tower, the seventh tallest telecommunication tower in the world. Rising 421 meters above sea level, this iconic tower offers spectacular 360-degree views of Kuala Lumpur.',
        description: 'Iconic telecommunication tower with observation deck',
        historicalInfo: 'Completed in 1996, KL Tower stands at 421 meters and is the seventh tallest telecommunication tower in the world. It serves as both a telecommunications hub and tourist attraction.',
        yearBuilt: '1996',
        architect: 'Kumpulan Senireka Sdn Bhd'
      },
      it: {
        name: 'Torre KL',
        narration: 'Benvenuto alla Torre KL, la settima torre per telecomunicazioni più alta del mondo. Con un\'altezza di 421 metri sul livello del mare, questa torre iconica offre viste spettacolari a 360 gradi di Kuala Lumpur.',
        description: 'Torre per telecomunicazioni iconica con piattaforma di osservazione',
        historicalInfo: 'Completata nel 1996, la Torre KL è alta 421 metri ed è la settima torre per telecomunicazioni più alta del mondo. Serve sia come hub per telecomunicazioni che come attrazione turistica.',
        yearBuilt: '1996',
        architect: 'Kumpulan Senireka Sdn Bhd'
      },
      ko: {
        name: 'KL 타워',
        narration: '세계에서 일곱 번째로 높은 통신 타워인 KL 타워에 오신 것을 환영합니다. 해발 421미터 높이로 솟아있는 이 상징적인 타워는 쿠알라룸푸르의 장관을 이루는 360도 전망을 제공합니다.',
        description: '전망대가 있는 상징적인 통신 타워',
        historicalInfo: '1996년에 완공된 KL 타워는 높이 421미터로 세계에서 일곱 번째로 높은 통신 타워입니다. 통신 허브이자 관광 명소로 기능합니다.',
        yearBuilt: '1996',
        architect: 'Kumpulan Senireka Sdn Bhd'
      }
    }
  },
  {
    id: 'central-market-kl',
    cityId: 'kuala-lumpur',
    name: 'Central Market',
    lat: 3.145833,
    lng: 101.695,
    radius: 80,
    narration: 'Welcome to Central Market, a cultural landmark in the heart of Kuala Lumpur. This historic market has been a hub for Malaysian arts, crafts, and culture since 1888.',
    description: 'Historic cultural market for arts and crafts',
    category: 'Cultural & Shopping',
    detailedDescription: 'Central Market, also known as Pasar Seni, is a cultural landmark located in the heart of Kuala Lumpur. Originally built in 1888 as a wet market, the Art Deco style building was saved from demolition in 1980 and repurposed as a cultural and craft center. The market was gazetted as a Heritage Site by the Malaysian Heritage Society in 1986. The two-story building now houses over 300 stalls selling traditional handicrafts, batik, paintings, sculptures, jewelry, and souvenirs representing Malaysia\'s multicultural heritage. The market is divided into sections representing the three main ethnic groups: Malay, Chinese, and Indian, showcasing their respective crafts and cultural items. The Annexe Gallery on the second floor hosts art exhibitions and cultural performances. Central Market is also famous for its street food court offering authentic Malaysian cuisine. The building\'s distinctive blue and white Art Deco facade has become an iconic landmark. The market serves as an important cultural center promoting Malaysian arts and crafts while preserving the country\'s heritage.',
    photos: [
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800',
      'https://images.unsplash.com/photo-1595506040715-1e3f5dc50d4b?w=800'
    ],
    historicalInfo: 'Originally built in 1888 as a wet market, Central Market was saved from demolition and designated a Heritage Site in 1986. It now serves as a cultural center for Malaysian arts and crafts.',
    yearBuilt: '1888',
    architect: 'Art Deco restoration in 1980s',
    translations: {
      en: {
        name: 'Central Market',
        narration: 'Welcome to Central Market, a cultural landmark in the heart of Kuala Lumpur. This historic market has been a hub for Malaysian arts, crafts, and culture since 1888.',
        description: 'Historic cultural market for arts and crafts',
        historicalInfo: 'Originally built in 1888 as a wet market, Central Market was saved from demolition and designated a Heritage Site in 1986. It now serves as a cultural center for Malaysian arts and crafts.',
        yearBuilt: '1888',
        architect: 'Art Deco restoration in 1980s'
      },
      it: {
        name: 'Mercato Centrale',
        narration: 'Benvenuto al Mercato Centrale, un punto di riferimento culturale nel cuore di Kuala Lumpur. Questo mercato storico è stato un centro per le arti, l\'artigianato e la cultura malese dal 1888.',
        description: 'Mercato culturale storico per arti e artigianato',
        historicalInfo: 'Originariamente costruito nel 1888 come mercato umido, il Mercato Centrale è stato salvato dalla demolizione e designato Sito del Patrimonio nel 1986. Ora funge da centro culturale per le arti e l\'artigianato malese.',
        yearBuilt: '1888',
        architect: 'Restauro Art Deco negli anni \'80'
      },
      ko: {
        name: '중앙 시장',
        narration: '쿠알라룸푸르 중심부의 문화적 랜드마크인 중앙 시장에 오신 것을 환영합니다. 이 역사적인 시장은 1888년부터 말레이시아 예술, 공예, 문화의 중심지였습니다.',
        description: '예술과 공예를 위한 역사적 문화 시장',
        historicalInfo: '원래 1888년에 재래시장으로 건설된 중앙 시장은 철거로부터 구해져 1986년 유산지로 지정되었습니다. 현재 말레이시아 예술과 공예의 문화 센터로 기능합니다.',
        yearBuilt: '1888',
        architect: '1980년대 아르데코 복원'
      }
    }
  },

  // Phuket, Thailand landmarks
  {
    id: 'big-buddha-phuket',
    cityId: 'phuket',
    name: 'Big Buddha Phuket',
    lat: 7.827582,
    lng: 98.312842,
    radius: 70,
    narration: 'Welcome to the Big Buddha, one of Phuket\'s most iconic landmarks. This 45-meter tall white marble statue sits atop the Nakkerd Hills and offers breathtaking 360-degree views.',
    description: '45-meter white marble Buddha statue on hilltop',
    category: 'Religious & Viewpoint',
    detailedDescription: 'The Big Buddha Phuket is one of the island\'s most important and revered landmarks. The massive image sits atop the Nakkerd Hills between Chalong and Kata and at 45 meters tall can be seen from far away. The statue is made of white Burmese marble and construction began in 2004, with ongoing additions and improvements. The Big Buddha sits in the Maravija pose, a traditional pose in which Buddha subdued the evil demon Mara. Visitors can walk around the base of the statue and enjoy spectacular 360-degree panoramic views of Phuket Town, Kata, Karon beaches, Chalong Bay, and on clear days, the Phi Phi Islands. The site is a place of worship and visitors are expected to dress respectfully. Around the main statue, there are smaller Buddha images, bells that visitors can ring for good luck, and donation boxes where proceeds go toward completing the Big Buddha project. The peaceful atmosphere, cool hilltop breezes, and stunning views make it a must-visit destination.',
    photos: [
      'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800',
      'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800'
    ],
    historicalInfo: 'Construction began in 2004 and is still ongoing. The 45-meter tall statue is made of white Burmese marble and has become one of Phuket\'s most visited landmarks.',
    yearBuilt: '2004-present',
    architect: 'Local Buddhist Community',
    translations: {
      en: {
        name: 'Big Buddha Phuket',
        narration: 'Welcome to the Big Buddha, one of Phuket\'s most iconic landmarks. This 45-meter tall white marble statue sits atop the Nakkerd Hills and offers breathtaking 360-degree views.',
        description: '45-meter white marble Buddha statue on hilltop',
        historicalInfo: 'Construction began in 2004 and is still ongoing. The 45-meter tall statue is made of white Burmese marble and has become one of Phuket\'s most visited landmarks.'
      },
      ko: {
        name: '푸켓 빅 붓다',
        narration: '푸켓의 가장 상징적인 랜드마크 중 하나인 빅 붓다에 오신 것을 환영합니다. 높이 45미터의 백색 대리석 동상이 나케르드 힐 꼭대기에 자리잡고 있으며 숨막히는 360도 전망을 제공합니다.',
        description: '언덕 꼭대기의 45미터 높이 백색 대리석 부처 동상',
        historicalInfo: '2004년에 건설이 시작되어 현재도 진행 중입니다. 높이 45미터의 동상은 백색 버마 대리석으로 만들어졌으며 푸켓에서 가장 많이 방문하는 랜드마크 중 하나가 되었습니다.'
      }
    }
  },
  {
    id: 'patong-beach',
    cityId: 'phuket',
    name: 'Patong Beach',
    lat: 7.895,
    lng: 98.296111,
    radius: 100,
    narration: 'Welcome to Patong Beach, Phuket\'s most famous and bustling beach. This 3-kilometer stretch of white sand offers water sports, restaurants, and vibrant nightlife.',
    description: 'Phuket\'s most popular beach and entertainment hub',
    category: 'Beach & Entertainment',
    detailedDescription: 'Patong Beach is the most famous and developed beach in Phuket, located on the west coast of the island. The 3-kilometer crescent-shaped beach is lined with hotels, restaurants, bars, and shops. Patong is known for its vibrant atmosphere, offering everything from water sports like jet skiing, parasailing, and banana boat rides during the day to bustling nightlife centered around Bangla Walking Street at night. The beach itself features soft white sand and clear turquoise water, though it can get crowded during peak tourist season. Patong has evolved from a quiet fishing village to Phuket\'s entertainment capital, offering shopping at Jungceylon mall, beachfront dining, massage parlors, and cultural shows. While it lacks the tranquility of other Phuket beaches, Patong\'s energy and variety of activities make it popular with travelers seeking excitement and convenience.',
    photos: [
      'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800',
      'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800'
    ],
    historicalInfo: 'Patong Beach transformed from a quiet tin-mining and fishing village in the 1980s to become Phuket\'s premier tourist destination and entertainment center.',
    yearBuilt: 'Natural Formation',
    architect: 'N/A',
    translations: {
      en: {
        name: 'Patong Beach',
        narration: 'Welcome to Patong Beach, Phuket\'s most famous and bustling beach. This 3-kilometer stretch of white sand offers water sports, restaurants, and vibrant nightlife.',
        description: 'Phuket\'s most popular beach and entertainment hub',
        historicalInfo: 'Patong Beach transformed from a quiet tin-mining and fishing village in the 1980s to become Phuket\'s premier tourist destination and entertainment center.'
      },
      ko: {
        name: '파통 비치',
        narration: '푸켓에서 가장 유명하고 번화한 해변인 파통 비치에 오신 것을 환영합니다. 3킬로미터 길이의 백사장은 수상 스포츠, 레스토랑, 활기찬 나이트라이프를 제공합니다.',
        description: '푸켓에서 가장 인기 있는 해변이자 엔터테인먼트 허브',
        historicalInfo: '파통 비치는 1980년대 조용한 주석 광산과 어촌 마을에서 푸켓의 주요 관광지이자 엔터테인먼트 중심지로 변모했습니다.'
      }
    }
  },
  {
    id: 'wat-chalong',
    cityId: 'phuket',
    name: 'Wat Chalong',
    lat: 7.845556,
    lng: 98.337778,
    radius: 60,
    narration: 'Welcome to Wat Chalong, Phuket\'s most important Buddhist temple. This ornate temple complex honors two revered monks and features beautiful traditional Thai architecture.',
    description: 'Phuket\'s largest and most visited Buddhist temple',
    category: 'Religious',
    detailedDescription: 'Wat Chalong, officially named Wat Chaithararam, is the largest and most visited Buddhist temple in Phuket. The temple was built in the early 19th century and is dedicated to two highly venerated monks, Luang Pho Chaem and Luang Pho Chuang, who helped suppress a Chinese rebellion in 1876 using their skills in herbal medicine and Thai martial arts. The temple complex features several buildings including the Grand Pagoda (Phra Mahathat Chedi), which houses a splinter of bone from Lord Buddha, the main ordination hall (ubosot), and statues of the revered monks. The architecture showcases traditional Thai design with ornate decorations, colorful murals depicting Buddha\'s life, and gilded details. Visitors come to pay respects, seek blessings, and participate in traditional merit-making activities. The temple grounds are peaceful and well-maintained, offering a cultural and spiritual experience.',
    photos: [
      'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800',
      'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800'
    ],
    historicalInfo: 'Built in the early 19th century, Wat Chalong honors two revered monks who helped suppress a Chinese rebellion in 1876. It is Phuket\'s most important Buddhist temple.',
    yearBuilt: 'Early 1800s',
    architect: 'Traditional Thai Buddhist Architects',
    translations: {
      en: {
        name: 'Wat Chalong',
        narration: 'Welcome to Wat Chalong, Phuket\'s most important Buddhist temple. This ornate temple complex honors two revered monks and features beautiful traditional Thai architecture.',
        description: 'Phuket\'s largest and most visited Buddhist temple',
        historicalInfo: 'Built in the early 19th century, Wat Chalong honors two revered monks who helped suppress a Chinese rebellion in 1876. It is Phuket\'s most important Buddhist temple.'
      },
      ko: {
        name: '왓 찰롱',
        narration: '푸켓에서 가장 중요한 불교 사원인 왓 찰롱에 오신 것을 환영합니다. 이 화려한 사원 복합체는 두 명의 존경받는 승려를 기리며 아름다운 전통 태국 건축을 특징으로 합니다.',
        description: '푸켓에서 가장 크고 가장 많이 방문하는 불교 사원',
        historicalInfo: '19세기 초에 건설된 왓 찰롱은 1876년 중국인 반란을 진압하는 데 도움을 준 두 명의 존경받는 승려를 기립니다. 푸켓에서 가장 중요한 불교 사원입니다.'
      }
    }
  },
  {
    id: 'karon-viewpoint',
    cityId: 'phuket',
    name: 'Karon Viewpoint',
    lat: 7.820833,
    lng: 98.3075,
    radius: 50,
    narration: 'Welcome to Karon Viewpoint, offering one of the most photographed views in Phuket. This scenic spot provides panoramic vistas of three bays: Kata Noi, Kata, and Karon.',
    description: 'Panoramic viewpoint overlooking three stunning bays',
    category: 'Viewpoint',
    detailedDescription: 'Karon Viewpoint, also known as Kata Viewpoint or Three Beaches Hill, is one of the most visited viewpoints in Phuket. Located on the road between Nai Harn and Kata beaches, the viewpoint sits on a hill offering spectacular panoramic views of three beautiful bays: Kata Noi Beach, Kata Beach, and Karon Beach. The turquoise waters contrasting with white sand beaches and lush green headlands create a postcard-perfect scene. The viewpoint is especially popular during sunset when the sky turns shades of orange and pink. There\'s a platform with benches where visitors can relax and take photos, and vendors sell refreshments and souvenirs. The site is easily accessible by car or scooter and is free to visit. It\'s a must-stop location for anyone traveling along Phuket\'s west coast.',
    photos: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800'
    ],
    historicalInfo: 'Karon Viewpoint has become one of Phuket\'s most iconic photo locations, offering unobstructed views of the island\'s west coast beaches.',
    yearBuilt: 'Natural Formation',
    architect: 'N/A',
    translations: {
      en: {
        name: 'Karon Viewpoint',
        narration: 'Welcome to Karon Viewpoint, offering one of the most photographed views in Phuket. This scenic spot provides panoramic vistas of three bays: Kata Noi, Kata, and Karon.',
        description: 'Panoramic viewpoint overlooking three stunning bays',
        historicalInfo: 'Karon Viewpoint has become one of Phuket\'s most iconic photo locations, offering unobstructed views of the island\'s west coast beaches.'
      },
      ko: {
        name: '카론 전망대',
        narration: '푸켓에서 가장 사진이 많이 찍히는 전망 중 하나를 제공하는 카론 전망대에 오신 것을 환영합니다. 이 경치 좋은 장소는 세 개의 만을 파노라마로 조망합니다: 카타 노이, 카타, 카론.',
        description: '세 개의 멋진 만이 내려다보이는 파노라마 전망대',
        historicalInfo: '카론 전망대는 섬 서해안 해변의 장애물 없는 전망을 제공하며 푸켓에서 가장 상징적인 사진 촬영 장소 중 하나가 되었습니다.'
      }
    }
  },
  {
    id: 'old-phuket-town',
    cityId: 'phuket',
    name: 'Old Phuket Town',
    lat: 7.883889,
    lng: 98.389444,
    radius: 100,
    narration: 'Welcome to Old Phuket Town, a charming historic district showcasing Sino-Portuguese architecture. This colorful neighborhood reflects Phuket\'s rich multicultural heritage and trading history.',
    description: 'Historic district with Sino-Portuguese architecture',
    category: 'Cultural Heritage',
    detailedDescription: 'Old Phuket Town is the historic heart of Phuket, showcasing beautifully preserved Sino-Portuguese architecture from the tin mining boom era of the late 19th and early 20th centuries. The district features colorful shophouses with ornate facades, reflecting the fusion of Chinese and European architectural styles. Major streets like Thalang Road, Dibuk Road, and Yaowarat Road are lined with heritage buildings that now house museums, art galleries, boutique hotels, cafes, and restaurants. The architecture reflects Phuket\'s prosperous past when Chinese immigrants came to work in the tin mines and settled in the area. Many buildings feature distinctive elements such as arched colonnades, decorative tiles, shuttered windows, and painted stucco facades. The Thai Hua Museum, housed in a former Chinese language school, tells the story of Phuket\'s Chinese heritage. Old Phuket Town is designated as a conservation area, and walking tours reveal hidden gems including Chinese shrines, old mansions, and traditional coffee shops. The Sunday Walking Street market brings the area to life with street food, crafts, and cultural performances.',
    photos: [
      'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800',
      'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800'
    ],
    historicalInfo: 'Old Phuket Town developed during the tin mining boom of the late 19th century, when Chinese immigrants settled and built Sino-Portuguese shophouses that now define the historic district.',
    yearBuilt: '1890s-1930s',
    architect: 'Various Chinese and European architects',
    translations: {
      en: {
        name: 'Old Phuket Town',
        narration: 'Welcome to Old Phuket Town, a charming historic district showcasing Sino-Portuguese architecture. This colorful neighborhood reflects Phuket\'s rich multicultural heritage and trading history.',
        description: 'Historic district with Sino-Portuguese architecture',
        historicalInfo: 'Old Phuket Town developed during the tin mining boom of the late 19th century, when Chinese immigrants settled and built Sino-Portuguese shophouses that now define the historic district.',
        yearBuilt: '1890s-1930s',
        architect: 'Various Chinese and European architects'
      },
      it: {
        name: 'Città Vecchia di Phuket',
        narration: 'Benvenuto alla Città Vecchia di Phuket, un affascinante quartiere storico che mostra l\'architettura sino-portoghese. Questo colorato quartiere riflette il ricco patrimonio multiculturale e la storia commerciale di Phuket.',
        description: 'Distretto storico con architettura sino-portoghese',
        historicalInfo: 'La Città Vecchia di Phuket si è sviluppata durante il boom dell\'estrazione dello stagno alla fine del XIX secolo, quando gli immigrati cinesi si stabilirono e costruirono shophouse sino-portoghesi che ora definiscono il distretto storico.',
        yearBuilt: '1890-1930',
        architect: 'Vari architetti cinesi ed europei'
      },
      ko: {
        name: '올드 푸켓 타운',
        narration: '중국-포르투갈 건축을 보여주는 매력적인 역사 지구인 올드 푸켓 타운에 오신 것을 환영합니다. 이 다채로운 지역은 푸켓의 풍부한 다문화 유산과 무역 역사를 반영합니다.',
        description: '중국-포르투갈 건축의 역사 지구',
        historicalInfo: '올드 푸켓 타운은 19세기 후반 주석 광산 붐 기간 동안 발전했으며, 중국 이민자들이 정착하여 현재 역사 지구를 정의하는 중국-포르투갈 샵하우스를 지었습니다.',
        yearBuilt: '1890년대-1930년대',
        architect: '다양한 중국 및 유럽 건축가'
      }
    }
  },
  {
    id: 'phi-phi-islands',
    cityId: 'phuket',
    name: 'Phi Phi Islands',
    lat: 7.740833,
    lng: 98.778333,
    radius: 100,
    narration: 'Welcome to the Phi Phi Islands, a tropical paradise featuring stunning limestone cliffs, crystal-clear waters, and pristine beaches. These iconic islands are among Thailand\'s most beautiful destinations.',
    description: 'Tropical island paradise with limestone cliffs',
    category: 'Island & Beach',
    detailedDescription: 'The Phi Phi Islands are an archipelago located in the Andaman Sea, about 45 kilometers southeast of Phuket. The group consists of six islands, with Phi Phi Don and Phi Phi Leh being the largest and most famous. Phi Phi Don is the only inhabited island and features a unique geography with two crescent-shaped bays connected by a narrow isthmus. The island offers stunning viewpoints, diving sites, and vibrant nightlife. Phi Phi Leh is uninhabited and famous for Maya Bay, which gained international fame as the filming location for the movie "The Beach" starring Leonardo DiCaprio. The islands feature dramatic limestone cliffs rising from turquoise waters, coral reefs teeming with marine life, and white sand beaches. Popular activities include snorkeling, diving, rock climbing, and island hopping. The waters around the islands are home to diverse marine species including tropical fish, sea turtles, and reef sharks. Maya Bay underwent a restoration period to recover from tourism impact and now operates with strict visitor limits to preserve its natural beauty.',
    photos: [
      'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800',
      'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800'
    ],
    historicalInfo: 'The Phi Phi Islands have been inhabited by Muslim fishermen for centuries. They gained international fame after the 2000 film "The Beach" and are now protected as part of Thailand\'s marine conservation efforts.',
    yearBuilt: 'Natural formation',
    architect: 'N/A',
    translations: {
      en: {
        name: 'Phi Phi Islands',
        narration: 'Welcome to the Phi Phi Islands, a tropical paradise featuring stunning limestone cliffs, crystal-clear waters, and pristine beaches. These iconic islands are among Thailand\'s most beautiful destinations.',
        description: 'Tropical island paradise with limestone cliffs',
        historicalInfo: 'The Phi Phi Islands have been inhabited by Muslim fishermen for centuries. They gained international fame after the 2000 film "The Beach" and are now protected as part of Thailand\'s marine conservation efforts.',
        yearBuilt: 'Natural formation',
        architect: 'N/A'
      },
      it: {
        name: 'Isole Phi Phi',
        narration: 'Benvenuto alle Isole Phi Phi, un paradiso tropicale caratterizzato da splendide scogliere calcaree, acque cristalline e spiagge incontaminate. Queste isole iconiche sono tra le destinazioni più belle della Thailandia.',
        description: 'Paradiso tropicale insulare con scogliere calcaree',
        historicalInfo: 'Le Isole Phi Phi sono state abitate da pescatori musulmani per secoli. Hanno acquisito fama internazionale dopo il film del 2000 "The Beach" e ora sono protette come parte degli sforzi di conservazione marina della Thailandia.',
        yearBuilt: 'Formazione naturale',
        architect: 'N/A'
      },
      ko: {
        name: '피피 섬',
        narration: '멋진 석회암 절벽, 수정처럼 맑은 물, 깨끗한 해변을 특징으로 하는 열대 낙원인 피피 섬에 오신 것을 환영합니다. 이 상징적인 섬들은 태국에서 가장 아름다운 목적지 중 하나입니다.',
        description: '석회암 절벽이 있는 열대 섬 낙원',
        historicalInfo: '피피 섬은 수세기 동안 무슬림 어부들이 거주해 왔습니다. 2000년 영화 "더 비치" 이후 국제적인 명성을 얻었으며 현재 태국의 해양 보존 노력의 일환으로 보호받고 있습니다.',
        yearBuilt: '자연 형성',
        architect: 'N/A'
      }
    }
  },
  {
    id: 'similan-islands',
    cityId: 'phuket',
    name: 'Similan Islands',
    lat: 8.6494,
    lng: 97.6425,
    radius: 100,
    narration: 'Welcome to the Similan Islands, one of the world\'s top diving destinations. This pristine archipelago features crystal-clear waters, vibrant coral reefs, and diverse marine life.',
    description: 'Premier diving destination with pristine coral reefs',
    category: 'Island & Marine Park',
    detailedDescription: 'The Similan Islands are an archipelago of 11 islands located in the Andaman Sea, about 84 kilometers northwest of Phuket. Designated as a national park in 1982, the Similan Islands Marine National Park protects one of Thailand\'s most pristine marine ecosystems. The islands are renowned worldwide as a premier diving and snorkeling destination, featuring crystal-clear waters with visibility often exceeding 30 meters, diverse coral reefs, and abundant marine life including manta rays, whale sharks, sea turtles, and countless tropical fish species. The name "Similan" comes from the Malay word "sembilan," meaning nine, referring to the original nine islands. Each island has unique characteristics - Island 8 (Koh Similan) features the iconic Sailing Rock formation and pristine white sand beaches, while Island 4 (Koh Miang) serves as the park headquarters. The islands feature giant granite boulders both above and below water, creating spectacular underwater landscapes and dive sites. The park is open seasonally (typically November to May) to protect the ecosystem during monsoon season. Strict regulations limit visitor numbers and activities to preserve this natural wonder.',
    photos: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
      'https://images.unsplash.com/photo-1527934111143-f2c94c664e50?w=800',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      'https://images.unsplash.com/photo-1511497584788-876760111969?w=800'
    ],
    historicalInfo: 'Designated as a national park in 1982, the Similan Islands are recognized as one of the world\'s top ten diving destinations and are protected to preserve their pristine marine ecosystem.',
    yearBuilt: '1982',
    architect: 'Thailand Department of National Parks',
    translations: {
      en: {
        name: 'Similan Islands',
        narration: 'Welcome to the Similan Islands, one of the world\'s top diving destinations. This pristine archipelago features crystal-clear waters, vibrant coral reefs, and diverse marine life.',
        description: 'Premier diving destination with pristine coral reefs',
        historicalInfo: 'Designated as a national park in 1982, the Similan Islands are recognized as one of the world\'s top ten diving destinations and are protected to preserve their pristine marine ecosystem.',
        yearBuilt: '1982',
        architect: 'Thailand Department of National Parks'
      },
      it: {
        name: 'Isole Similan',
        narration: 'Benvenuto alle Isole Similan, una delle migliori destinazioni subacquee del mondo. Questo arcipelago incontaminato presenta acque cristalline, barriere coralline vibranti e una vita marina diversificata.',
        description: 'Destinazione subacquea di prima classe con barriere coralline incontaminate',
        historicalInfo: 'Designate come parco nazionale nel 1982, le Isole Similan sono riconosciute come una delle dieci migliori destinazioni subacquee del mondo e sono protette per preservare il loro ecosistema marino incontaminato.',
        yearBuilt: '1982',
        architect: 'Dipartimento dei Parchi Nazionali della Thailandia'
      },
      ko: {
        name: '시밀란 제도',
        narration: '세계 최고의 다이빙 목적지 중 하나인 시밀란 제도에 오신 것을 환영합니다. 이 깨끗한 군도는 수정처럼 맑은 물, 생동감 넘치는 산호초, 다양한 해양 생물을 특징으로 합니다.',
        description: '깨끗한 산호초가 있는 최고의 다이빙 목적지',
        historicalInfo: '1982년 국립공원으로 지정된 시밀란 제도는 세계 10대 다이빙 목적지 중 하나로 인정받고 있으며 깨끗한 해양 생태계를 보존하기 위해 보호받고 있습니다.',
        yearBuilt: '1982',
        architect: '태국 국립공원부'
      }
    }
  },
  // Activities
  {
    id: 'vatican-night-tour',
    cityId: 'rome',
    name: 'Vatican Museums Night Tour',
    lat: 41.9065,
    lng: 12.4536,
    radius: 80,
    narration: 'Experience the Vatican Museums like never before on this exclusive after-hours tour. Explore the galleries and Sistine Chapel without the daytime crowds.',
    description: 'Exclusive after-hours tour of Vatican Museums',
    category: 'Activity',
    detailedDescription: 'The Vatican Museums Night Tour offers a once-in-a-lifetime opportunity to explore one of the world\'s greatest art collections in an intimate setting. Available on select Friday evenings, this exclusive experience allows visitors to wander through the magnificent galleries, marvel at the Raphael Rooms, and stand in awe beneath Michelangelo\'s Sistine Chapel ceiling without the usual crowds. The tour includes expert guides who bring the artworks to life with fascinating stories and historical insights. The atmospheric evening lighting creates a magical ambiance, transforming familiar masterpieces and revealing details often missed during busy daytime visits.',
    photos: [
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=800',
      'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800'
    ],
    historicalInfo: 'Night tours began in 2000 to offer visitors a more intimate experience of the Vatican\'s treasures.',
    yearBuilt: '2000',
    architect: 'Vatican Museums Administration',
    translations: {
      en: {
        name: 'Vatican Museums Night Tour',
        narration: 'Experience the Vatican Museums like never before on this exclusive after-hours tour. Explore the galleries and Sistine Chapel without the daytime crowds.',
        description: 'Exclusive after-hours tour of Vatican Museums',
        detailedDescription: 'The Vatican Museums Night Tour offers a once-in-a-lifetime opportunity to explore one of the world\'s greatest art collections in an intimate setting. Available on select Friday evenings, this exclusive experience allows visitors to wander through the magnificent galleries, marvel at the Raphael Rooms, and stand in awe beneath Michelangelo\'s Sistine Chapel ceiling without the usual crowds. The tour includes expert guides who bring the artworks to life with fascinating stories and historical insights. The atmospheric evening lighting creates a magical ambiance, transforming familiar masterpieces and revealing details often missed during busy daytime visits.',
        historicalInfo: 'Night tours began in 2000 to offer visitors a more intimate experience of the Vatican\'s treasures.',
        yearBuilt: '2000',
        architect: 'Vatican Museums Administration'
      },
      it: {
        name: 'Tour Notturno dei Musei Vaticani',
        narration: 'Vivi i Musei Vaticani come mai prima d\'ora con questo tour esclusivo dopo l\'orario di chiusura. Esplora le gallerie e la Cappella Sistina senza le folle diurne.',
        description: 'Tour esclusivo dopo l\'orario dei Musei Vaticani',
        detailedDescription: 'Il Tour Notturno dei Musei Vaticani offre un\'opportunità unica di esplorare una delle più grandi collezioni d\'arte del mondo in un ambiente intimo. Disponibile in selezionate serate del venerdì, questa esperienza esclusiva permette ai visitatori di passeggiare attraverso le magnifiche gallerie, ammirare le Stanze di Raffaello e rimanere in ammirazione sotto il soffitto della Cappella Sistina di Michelangelo senza le solite folle. Il tour include guide esperte che danno vita alle opere d\'arte con storie affascinanti e approfondimenti storici. L\'illuminazione serale atmosferica crea un\'atmosfera magica, trasformando capolavori familiari e rivelando dettagli spesso persi durante le visite diurne affollate.',
        historicalInfo: 'I tour notturni sono iniziati nel 2000 per offrire ai visitatori un\'esperienza più intima dei tesori del Vaticano.',
        yearBuilt: '2000',
        architect: 'Amministrazione dei Musei Vaticani'
      },
      ko: {
        name: '바티칸 박물관 야간 투어',
        narration: '이 독점 야간 투어로 바티칸 박물관을 전혀 새로운 방식으로 경험하세요. 낮의 인파 없이 갤러리와 시스티나 성당을 탐험하세요.',
        description: '바티칸 박물관 독점 야간 투어',
        detailedDescription: '바티칸 박물관 야간 투어는 세계 최고의 예술 컬렉션 중 하나를 친밀한 환경에서 탐험할 수 있는 일생일대의 기회를 제공합니다. 특정 금요일 저녁에 제공되는 이 독점 경험을 통해 방문객들은 화려한 갤러리를 산책하고, 라파엘로의 방을 감상하며, 평소 인파 없이 미켈란젤로의 시스티나 성당 천장 아래에서 경외감을 느낄 수 있습니다. 투어에는 매혹적인 이야기와 역사적 통찰력으로 예술 작품을 생생하게 전달하는 전문 가이드가 포함됩니다. 분위기 있는 저녁 조명은 마법 같은 분위기를 조성하여 익숙한 걸작을 변화시키고 혼잡한 낮 방문 시 자주 놓치는 세부 사항을 드러냅니다.',
        historicalInfo: '야간 투어는 2000년부터 시작되어 방문객들에게 바티칸 보물에 대한 보다 친밀한 경험을 제공합니다.',
        yearBuilt: '2000',
        architect: '바티칸 박물관 관리국'
      },
      es: {
        name: 'Tour Nocturno de los Museos Vaticanos',
        narration: 'Experimente los Museos Vaticanos como nunca antes en este exclusivo tour nocturno. Explore las galerías y la Capilla Sixtina sin las multitudes del día.',
        description: 'Tour exclusivo nocturno de los Museos Vaticanos',
        detailedDescription: 'El Tour Nocturno de los Museos Vaticanos ofrece una oportunidad única para explorar una de las mayores colecciones de arte del mundo en un ambiente íntimo. Disponible en viernes selectos por la noche, esta experiencia exclusiva permite a los visitantes pasear por las magníficas galerías, admirar las Estancias de Rafael y contemplar el techo de la Capilla Sixtina de Miguel Ángel sin las multitudes habituales.'
      },
      fr: {
        name: 'Visite Nocturne des Musées du Vatican',
        narration: 'Vivez les Musées du Vatican comme jamais auparavant lors de cette visite exclusive en soirée. Explorez les galeries et la Chapelle Sixtine sans la foule de la journée.',
        description: 'Visite exclusive en soirée des Musées du Vatican',
        detailedDescription: 'La Visite Nocturne des Musées du Vatican offre une opportunité unique d\'explorer l\'une des plus grandes collections d\'art au monde dans un cadre intime. Disponible certains vendredis soirs, cette expérience exclusive permet aux visiteurs de déambuler dans les magnifiques galeries, d\'admirer les Chambres de Raphaël et de contempler le plafond de la Chapelle Sixtine de Michel-Ange sans la foule habituelle.'
      },
      de: {
        name: 'Vatikanische Museen Nacht-Tour',
        narration: 'Erleben Sie die Vatikanischen Museen wie nie zuvor bei dieser exklusiven Abendführung. Erkunden Sie die Galerien und die Sixtinische Kapelle ohne die Menschenmassen des Tages.',
        description: 'Exklusive Abendführung durch die Vatikanischen Museen',
        detailedDescription: 'Die Nacht-Tour durch die Vatikanischen Museen bietet eine einmalige Gelegenheit, eine der größten Kunstsammlungen der Welt in intimem Rahmen zu erkunden. An ausgewählten Freitagabenden ermöglicht dieses exklusive Erlebnis den Besuchern, durch die prächtigen Galerien zu wandeln, die Raffael-Säle zu bewundern und unter Michelangelos Decke der Sixtinischen Kapelle zu staunen.'
      },
      zh: {
        name: '梵蒂冈博物馆夜间之旅',
        narration: '在这次独家夜间之旅中以前所未有的方式体验梵蒂冈博物馆。无需白天的人潮，探索画廊和西斯廷教堂。',
        description: '梵蒂冈博物馆独家夜间之旅',
        detailedDescription: '梵蒂冈博物馆夜间之旅提供了一个千载难逢的机会，在私密的环境中探索世界上最伟大的艺术收藏之一。这种独家体验在特定的周五晚间提供，让游客可以漫步于宏伟的画廊，欣赏拉斐尔画室，并在没有通常人群的情况下仰望米开朗基罗的西斯廷教堂天花板。'
      },
      ja: {
        name: 'バチカン美術館ナイトツアー',
        narration: 'この独占的な夜間ツアーで、これまでにない方法でバチカン美術館を体験してください。日中の混雑なしにギャラリーとシスティーナ礼拝堂を探索できます。',
        description: 'バチカン美術館独占夜間ツアー',
        detailedDescription: 'バチカン美術館ナイトツアーは、世界最高の芸術コレクションの一つを親密な環境で探索する一生に一度の機会を提供します。特定の金曜日の夜に利用可能なこの独占体験では、壮大なギャラリーを散策し、ラファエロの間を鑑賞し、通常の人混みなしにミケランジェロのシスティーナ礼拝堂の天井に畏敬の念を抱くことができます。'
      },
      pt: {
        name: 'Tour Noturno dos Museus do Vaticano',
        narration: 'Experimente os Museus do Vaticano como nunca antes neste tour exclusivo noturno. Explore as galerias e a Capela Sistina sem as multidões do dia.',
        description: 'Tour exclusivo noturno dos Museus do Vaticano',
        detailedDescription: 'O Tour Noturno dos Museus do Vaticano oferece uma oportunidade única de explorar uma das maiores coleções de arte do mundo em um ambiente íntimo. Disponível em sextas-feiras selecionadas à noite, esta experiência exclusiva permite que os visitantes passeiem pelas magníficas galerias, admirem as Salas de Rafael e contemplem o teto da Capela Sistina de Michelangelo sem as multidões habituais.'
      },
      ru: {
        name: 'Ночной тур по Музеям Ватикана',
        narration: 'Ощутите Музеи Ватикана как никогда раньше во время этого эксклюзивного вечернего тура. Исследуйте галереи и Сикстинскую капеллу без дневных толп.',
        description: 'Эксклюзивный вечерний тур по Музеям Ватикана',
        detailedDescription: 'Ночной тур по Музеям Ватикана предлагает уникальную возможность исследовать одну из величайших художественных коллекций мира в интимной обстановке. Доступный по избранным пятницам вечером, этот эксклюзивный опыт позволяет посетителям прогуляться по великолепным галереям, полюбоваться Станцами Рафаэля и благоговеть перед потолком Сикстинской капеллы Микеланджело.'
      }
    }
  },
  {
    id: 'roman-food-tour',
    cityId: 'rome',
    name: 'Traditional Roman Food Tour',
    lat: 41.8967,
    lng: 12.4822,
    radius: 70,
    narration: 'Discover the authentic flavors of Rome on this guided food tour through Trastevere and Jewish Ghetto. Taste traditional dishes and learn about Roman culinary history.',
    description: 'Guided tour of Rome\'s traditional cuisine and food culture',
    category: 'Activity',
    detailedDescription: 'This immersive food tour takes you through Rome\'s most authentic neighborhoods to discover the city\'s rich culinary traditions. Led by local food experts, you\'ll visit family-run trattorias, historic bakeries, and artisan food shops in Trastevere and the Jewish Ghetto. Sample traditional Roman dishes like carbonara, cacio e pepe, supplì, and Jewish-Roman specialties like carciofi alla giudia (Jewish-style artichokes). Learn about the history behind each dish, meet passionate local producers, and discover hidden culinary gems that most tourists never find. The tour includes tastings at 5-6 venues, enough food for a full meal.',
    photos: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      'https://images.unsplash.com/photo-1476124369491-c2f4d4f2f895?w=800',
      'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=800',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800',
      'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800',
      'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=800'
    ],
    historicalInfo: 'Roman cuisine has roots dating back to ancient times, with many traditional recipes passed down through generations.',
    yearBuilt: 'Ancient tradition',
    architect: 'Roman culinary heritage',
    translations: {
      en: {
        name: 'Traditional Roman Food Tour',
        narration: 'Discover the authentic flavors of Rome on this guided food tour through Trastevere and Jewish Ghetto. Taste traditional dishes and learn about Roman culinary history.',
        description: 'Guided tour of Rome\'s traditional cuisine and food culture',
        detailedDescription: 'This immersive food tour takes you through Rome\'s most authentic neighborhoods to discover the city\'s rich culinary traditions. Led by local food experts, you\'ll visit family-run trattorias, historic bakeries, and artisan food shops in Trastevere and the Jewish Ghetto. Sample traditional Roman dishes like carbonara, cacio e pepe, supplì, and Jewish-Roman specialties like carciofi alla giudia (Jewish-style artichokes). Learn about the history behind each dish, meet passionate local producers, and discover hidden culinary gems that most tourists never find. The tour includes tastings at 5-6 venues, enough food for a full meal.',
        historicalInfo: 'Roman cuisine has roots dating back to ancient times, with many traditional recipes passed down through generations.',
        yearBuilt: 'Ancient tradition',
        architect: 'Roman culinary heritage'
      },
      it: {
        name: 'Tour Gastronomico Tradizionale Romano',
        narration: 'Scopri i sapori autentici di Roma in questo tour gastronomico guidato attraverso Trastevere e il Ghetto Ebraico. Assaggia piatti tradizionali e impara la storia culinaria romana.',
        description: 'Tour guidato della cucina tradizionale e della cultura gastronomica romana',
        detailedDescription: 'Questo tour gastronomico immersivo ti porta attraverso i quartieri più autentici di Roma per scoprire le ricche tradizioni culinarie della città. Guidato da esperti gastronomici locali, visiterai trattorie a conduzione familiare, panifici storici e negozi di alimentari artigianali a Trastevere e nel Ghetto Ebraico. Assaggia piatti tradizionali romani come carbonara, cacio e pepe, supplì e specialità giudaico-romane come i carciofi alla giudia. Scopri la storia dietro ogni piatto, incontra produttori locali appassionati e scopri gemme culinarie nascoste che la maggior parte dei turisti non trova mai. Il tour include degustazioni in 5-6 locali, cibo sufficiente per un pasto completo.',
        historicalInfo: 'La cucina romana ha radici che risalgono ai tempi antichi, con molte ricette tradizionali tramandate di generazione in generazione.',
        yearBuilt: 'Tradizione antica',
        architect: 'Patrimonio culinario romano'
      },
      ko: {
        name: '전통 로마 음식 투어',
        narration: '트라스테베레와 유대인 게토를 통한 이 가이드 음식 투어에서 로마의 진정한 맛을 발견하세요. 전통 요리를 맛보고 로마 요리 역사를 배우세요.',
        description: '로마의 전통 요리와 음식 문화 가이드 투어',
        detailedDescription: '이 몰입형 음식 투어는 로마의 가장 진정한 동네를 통해 도시의 풍부한 요리 전통을 발견합니다. 현지 음식 전문가가 이끄는 이 투어에서 트라스테베레와 유대인 게토의 가족 운영 트라토리아, 역사적인 베이커리, 장인 식품 가게를 방문합니다. 카르보나라, 카치오 에 페페, 수플리와 같은 전통 로마 요리와 카르치오피 알라 주디아(유대식 아티초크)와 같은 유대-로마 특선 요리를 맛보세요. 각 요리의 역사를 배우고, 열정적인 현지 생산자를 만나며, 대부분의 관광객이 찾지 못하는 숨겨진 요리 보석을 발견하세요. 투어에는 5-6개 장소에서의 시식이 포함되어 있으며, 한 끼 식사로 충분한 양입니다.',
        historicalInfo: '로마 요리는 고대 시대로 거슬러 올라가는 뿌리를 가지고 있으며, 많은 전통 레시피가 세대를 거쳐 전해져 내려옵니다.',
        yearBuilt: '고대 전통',
        architect: '로마 요리 유산'
      },
      es: {
        name: 'Tour Gastronómico Romano Tradicional',
        narration: 'Descubra los sabores auténticos de Roma en este tour gastronómico guiado por Trastevere y el Gueto Judío. Pruebe platos tradicionales y aprenda sobre la historia culinaria romana.',
        description: 'Tour guiado de la cocina tradicional y cultura gastronómica romana',
        detailedDescription: 'Este tour gastronómico inmersivo le lleva por los barrios más auténticos de Roma para descubrir las ricas tradiciones culinarias de la ciudad. Guiado por expertos gastronómicos locales, visitará trattorias familiares, panaderías históricas y tiendas de artesanías alimentarias en Trastevere y el Gueto Judío. Pruebe platos romanos tradicionales como carbonara, cacio e pepe, supplì y especialidades judeo-romanas como carciofi alla giudia.'
      },
      fr: {
        name: 'Tour Gastronomique Romain Traditionnel',
        narration: 'Découvrez les saveurs authentiques de Rome lors de cette visite gastronomique guidée à travers Trastevere et le Ghetto Juif. Goûtez aux plats traditionnels et apprenez l\'histoire culinaire romaine.',
        description: 'Visite guidée de la cuisine traditionnelle et de la culture gastronomique romaine',
        detailedDescription: 'Cette visite gastronomique immersive vous emmène à travers les quartiers les plus authentiques de Rome pour découvrir les riches traditions culinaires de la ville. Guidé par des experts gastronomiques locaux, vous visiterez des trattorias familiales, des boulangeries historiques et des boutiques d\'artisans alimentaires à Trastevere et dans le Ghetto Juif. Goûtez aux plats romains traditionnels comme la carbonara, le cacio e pepe, les supplì et les spécialités judéo-romaines comme les carciofi alla giudia.'
      },
      de: {
        name: 'Traditionelle Römische Food-Tour',
        narration: 'Entdecken Sie die authentischen Aromen Roms bei dieser geführten Food-Tour durch Trastevere und das Jüdische Ghetto. Probieren Sie traditionelle Gerichte und lernen Sie die römische Kochgeschichte kennen.',
        description: 'Geführte Tour durch die traditionelle römische Küche und Esskultur',
        detailedDescription: 'Diese immersive Food-Tour führt Sie durch Roms authentischste Viertel, um die reichen kulinarischen Traditionen der Stadt zu entdecken. Unter der Führung lokaler Gastronomiexperten besuchen Sie familiengeführte Trattorias, historische Bäckereien und handwerkliche Lebensmittelgeschäfte in Trastevere und dem Jüdischen Ghetto. Probieren Sie traditionelle römische Gerichte wie Carbonara, Cacio e Pepe, Supplì und jüdisch-römische Spezialitäten wie Carciofi alla Giudia.'
      },
      zh: {
        name: '传统罗马美食之旅',
        narration: '在这次穿越特拉斯提弗列和犹太区的导览美食之旅中发现罗马的正宗风味。品尝传统菜肴，了解罗马烹饪历史。',
        description: '罗马传统美食和饮食文化导览',
        detailedDescription: '这次沉浸式美食之旅带您穿越罗马最正宗的街区，发现这座城市丰富的烹饪传统。在当地美食专家的带领下，您将参观特拉斯提弗列和犹太区的家族经营餐馆、历史悠久的面包店和手工食品店。品尝传统罗马菜肴如培根蛋面、奶酪胡椒面、炸米球，以及犹太罗马特色菜如犹太式洋蓟。'
      },
      ja: {
        name: '伝統的ローマ料理ツアー',
        narration: 'トラステヴェレとユダヤ人地区を巡るこのガイド付きフードツアーで、ローマの本格的な味を発見してください。伝統料理を味わい、ローマの料理の歴史を学びましょう。',
        description: 'ローマの伝統料理と食文化のガイドツアー',
        detailedDescription: 'この没入型フードツアーでは、ローマで最も本格的な地区を巡り、この街の豊かな料理の伝統を発見します。地元の食の専門家に案内され、トラステヴェレとユダヤ人地区の家族経営のトラットリア、歴史的なベーカリー、職人の食品店を訪れます。カルボナーラ、カチョエペペ、スップリなどの伝統的なローマ料理や、カルチョーフィ・アッラ・ジュディアなどのユダヤ・ローマ料理を味わいます。'
      },
      pt: {
        name: 'Tour Gastronômico Romano Tradicional',
        narration: 'Descubra os sabores autênticos de Roma neste tour gastronômico guiado por Trastevere e o Gueto Judaico. Prove pratos tradicionais e aprenda sobre a história culinária romana.',
        description: 'Tour guiado pela culinária tradicional e cultura gastronômica romana',
        detailedDescription: 'Este tour gastronômico imersivo leva você pelos bairros mais autênticos de Roma para descobrir as ricas tradições culinárias da cidade. Guiado por especialistas gastronômicos locais, você visitará trattorias familiares, padarias históricas e lojas de alimentos artesanais em Trastevere e no Gueto Judaico. Prove pratos romanos tradicionais como carbonara, cacio e pepe, supplì e especialidades judaico-romanas como carciofi alla giudia.'
      },
      ru: {
        name: 'Традиционный Римский Гастрономический Тур',
        narration: 'Откройте для себя подлинные вкусы Рима в этом гастрономическом туре по Трастевере и Еврейскому гетто. Попробуйте традиционные блюда и узнайте о римской кулинарной истории.',
        description: 'Экскурсия по традиционной римской кухне и гастрономической культуре',
        detailedDescription: 'Этот иммерсивный гастрономический тур проведет вас по самым аутентичным районам Рима, чтобы открыть богатые кулинарные традиции города. Под руководством местных гастрономических экспертов вы посетите семейные траттории, исторические пекарни и ремесленные продуктовые магазины в Трастевере и Еврейском гетто. Попробуйте традиционные римские блюда, такие как карбонара, качо э пепе, суппли и иудейско-римские деликатесы.'
      }
    }
  },
  {
    id: 'seine-river-cruise',
    cityId: 'paris',
    name: 'Seine River Dinner Cruise',
    lat: 48.8606,
    lng: 2.3376,
    radius: 60,
    narration: 'Experience Paris from the water on this romantic Seine River dinner cruise. Enjoy gourmet French cuisine while gliding past illuminated landmarks.',
    description: 'Romantic dinner cruise along the Seine River',
    category: 'Activity',
    detailedDescription: 'A Seine River dinner cruise offers one of the most romantic and memorable ways to experience Paris. Glide along the historic river aboard an elegant glass-enclosed boat, enjoying a multi-course gourmet French meal prepared by skilled chefs. As you dine, watch the City of Light\'s most famous landmarks pass by - the Eiffel Tower sparkling on the hour, Notre-Dame Cathedral, the Louvre, and charming riverside buildings bathed in golden light. Live music creates an enchanting atmosphere as the boat travels from the Eiffel Tower to Île Saint-Louis and back. Choose from lunch, afternoon, or evening cruises, with the sunset and nighttime departures being particularly magical.',
    photos: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
      'https://images.unsplash.com/photo-1549144511-f099e773c147?w=800',
      'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
      'https://images.unsplash.com/photo-1560174038-da43ac56f5b8?w=800',
      'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=800',
      'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=800',
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800'
    ],
    historicalInfo: 'Seine River cruises have been a Parisian tradition since the 1860s, offering unique perspectives of the city.',
    yearBuilt: '1860s',
    architect: 'Various cruise operators',
    translations: {
      en: {
        name: 'Seine River Dinner Cruise',
        narration: 'Experience Paris from the water on this romantic Seine River dinner cruise. Enjoy gourmet French cuisine while gliding past illuminated landmarks.',
        description: 'Romantic dinner cruise along the Seine River',
        detailedDescription: 'A Seine River dinner cruise offers one of the most romantic and memorable ways to experience Paris. Glide along the historic river aboard an elegant glass-enclosed boat, enjoying a multi-course gourmet French meal prepared by skilled chefs. As you dine, watch the City of Light\'s most famous landmarks pass by - the Eiffel Tower sparkling on the hour, Notre-Dame Cathedral, the Louvre, and charming riverside buildings bathed in golden light. Live music creates an enchanting atmosphere as the boat travels from the Eiffel Tower to Île Saint-Louis and back. Choose from lunch, afternoon, or evening cruises, with the sunset and nighttime departures being particularly magical.',
        historicalInfo: 'Seine River cruises have been a Parisian tradition since the 1860s, offering unique perspectives of the city.',
        yearBuilt: '1860s',
        architect: 'Various cruise operators'
      },
      it: {
        name: 'Crociera con Cena sulla Senna',
        narration: 'Vivi Parigi dall\'acqua in questa romantica crociera con cena sulla Senna. Gusta la cucina francese gourmet mentre scivoli accanto ai monumenti illuminati.',
        description: 'Romantica crociera con cena lungo la Senna',
        detailedDescription: 'Una crociera con cena sulla Senna offre uno dei modi più romantici e memorabili per vivere Parigi. Scivola lungo il fiume storico a bordo di un\'elegante barca chiusa in vetro, gustando un pasto gourmet francese multi-portata preparato da chef esperti. Mentre ceni, guarda i monumenti più famosi della Città della Luce passare - la Torre Eiffel che brilla ogni ora, la Cattedrale di Notre-Dame, il Louvre e affascinanti edifici lungo il fiume immersi nella luce dorata. La musica dal vivo crea un\'atmosfera incantevole mentre la barca viaggia dalla Torre Eiffel all\'Île Saint-Louis e ritorno. Scegli tra crociere a pranzo, pomeriggio o sera, con le partenze al tramonto e notturne particolarmente magiche.',
        historicalInfo: 'Le crociere sulla Senna sono una tradizione parigina dal 1860, offrendo prospettive uniche della città.',
        yearBuilt: '1860',
        architect: 'Vari operatori di crociera'
      },
      ko: {
        name: '센 강 디너 크루즈',
        narration: '이 낭만적인 센 강 디너 크루즈에서 물 위에서 파리를 경험하세요. 조명이 켜진 랜드마크를 지나며 프랑스 고급 요리를 즐기세요.',
        description: '센 강을 따라 낭만적인 디너 크루즈',
        detailedDescription: '센 강 디너 크루즈는 파리를 경험하는 가장 낭만적이고 기억에 남는 방법 중 하나입니다. 우아한 유리로 둘러싸인 보트를 타고 역사적인 강을 따라 미끄러지며, 숙련된 셰프가 준비한 여러 코스의 프랑스 고급 식사를 즐기세요. 식사를 하는 동안 빛의 도시의 가장 유명한 랜드마크가 지나가는 것을 지켜보세요 - 매시간 반짝이는 에펠탑, 노트르담 대성당, 루브르 박물관, 그리고 황금빛에 물든 매력적인 강변 건물들. 라이브 음악이 매혹적인 분위기를 조성하며 보트는 에펠탑에서 생루이 섬까지 왕복합니다. 점심, 오후 또는 저녁 크루즈 중에서 선택할 수 있으며, 일몰과 야간 출발이 특히 마법 같습니다.',
        historicalInfo: '센 강 크루즈는 1860년대부터 파리의 전통이 되어 왔으며 도시의 독특한 전망을 제공합니다.',
        yearBuilt: '1860년대',
        architect: '다양한 크루즈 운영사'
      }
    }
  },
  {
    id: 'paris-wine-tasting',
    cityId: 'paris',
    name: 'French Wine Tasting Experience',
    lat: 48.8584,
    lng: 2.2945,
    radius: 50,
    narration: 'Discover the art of French wine at this guided tasting experience. Learn about different regions and varietals while sampling premium wines.',
    description: 'Guided French wine tasting with expert sommelier',
    category: 'Activity',
    detailedDescription: 'This sophisticated wine tasting experience introduces you to the rich diversity of French wines. Led by a certified sommelier, you\'ll learn to identify different grape varieties, understand terroir, and develop your palate. The session typically includes 5-7 carefully selected wines from major French regions including Bordeaux, Burgundy, Champagne, Loire Valley, and Rhône. Your expert guide will teach you proper tasting techniques, discuss the history and characteristics of each region, and pair the wines with French cheeses and charcuterie. Whether you\'re a beginner or enthusiast, this experience provides valuable insights into French wine culture. Held in intimate wine cellars or elegant tasting rooms in central Paris.',
    photos: [
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800',
      'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=800',
      'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=800',
      'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800',
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800',
      'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=800',
      'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800'
    ],
    historicalInfo: 'France has over 2000 years of winemaking history and produces some of the world\'s finest wines.',
    yearBuilt: 'Ancient tradition',
    architect: 'French viticulture',
    translations: {
      en: {
        name: 'French Wine Tasting Experience',
        narration: 'Discover the art of French wine at this guided tasting experience. Learn about different regions and varietals while sampling premium wines.',
        description: 'Guided French wine tasting with expert sommelier',
        detailedDescription: 'This sophisticated wine tasting experience introduces you to the rich diversity of French wines. Led by a certified sommelier, you\'ll learn to identify different grape varieties, understand terroir, and develop your palate. The session typically includes 5-7 carefully selected wines from major French regions including Bordeaux, Burgundy, Champagne, Loire Valley, and Rhône. Your expert guide will teach you proper tasting techniques, discuss the history and characteristics of each region, and pair the wines with French cheeses and charcuterie. Whether you\'re a beginner or enthusiast, this experience provides valuable insights into French wine culture. Held in intimate wine cellars or elegant tasting rooms in central Paris.',
        historicalInfo: 'France has over 2000 years of winemaking history and produces some of the world\'s finest wines.',
        yearBuilt: 'Ancient tradition',
        architect: 'French viticulture'
      },
      it: {
        name: 'Esperienza di Degustazione Vini Francesi',
        narration: 'Scopri l\'arte del vino francese in questa esperienza di degustazione guidata. Impara le diverse regioni e varietà mentre assaggi vini premium.',
        description: 'Degustazione guidata di vini francesi con sommelier esperto',
        detailedDescription: 'Questa sofisticata esperienza di degustazione di vini ti introduce alla ricca diversità dei vini francesi. Guidato da un sommelier certificato, imparerai a identificare diverse varietà di uve, comprendere il terroir e sviluppare il tuo palato. La sessione include tipicamente 5-7 vini accuratamente selezionati dalle principali regioni francesi tra cui Bordeaux, Borgogna, Champagne, Valle della Loira e Rodano. La tua guida esperta ti insegnerà le tecniche di degustazione corrette, discuterà la storia e le caratteristiche di ogni regione e abbinerà i vini con formaggi francesi e salumi. Che tu sia un principiante o un appassionato, questa esperienza fornisce preziose intuizioni sulla cultura del vino francese. Si svolge in cantine intime o eleganti sale di degustazione nel centro di Parigi.',
        historicalInfo: 'La Francia ha oltre 2000 anni di storia vinicola e produce alcuni dei migliori vini del mondo.',
        yearBuilt: 'Tradizione antica',
        architect: 'Viticoltura francese'
      },
      ko: {
        name: '프랑스 와인 시음 체험',
        narration: '이 가이드 시음 체험에서 프랑스 와인의 예술을 발견하세요. 프리미엄 와인을 맛보며 다양한 지역과 품종에 대해 배우세요.',
        description: '전문 소믈리에와 함께하는 프랑스 와인 가이드 시음',
        detailedDescription: '이 세련된 와인 시음 체험은 프랑스 와인의 풍부한 다양성을 소개합니다. 공인 소믈리에가 이끄는 이 체험에서 다양한 포도 품종을 식별하고, 테루아를 이해하며, 입맛을 개발하는 방법을 배웁니다. 세션에는 일반적으로 보르도, 부르고뉴, 샴페인, 루아르 밸리, 론 등 주요 프랑스 지역에서 신중하게 선택된 5-7가지 와인이 포함됩니다. 전문 가이드가 적절한 시음 기술을 가르치고, 각 지역의 역사와 특성을 논의하며, 프랑스 치즈와 샤퀴테리와 와인을 페어링합니다. 초보자든 애호가든, 이 체험은 프랑스 와인 문화에 대한 귀중한 통찰력을 제공합니다. 파리 중심부의 친밀한 와인 셀러 또는 우아한 시음실에서 개최됩니다.',
        historicalInfo: '프랑스는 2000년 이상의 와인 제조 역사를 가지고 있으며 세계 최고급 와인을 생산합니다.',
        yearBuilt: '고대 전통',
        architect: '프랑스 포도 재배'
      }
    }
  },
  {
    id: 'thames-river-cruise',
    cityId: 'london',
    name: 'Thames River Sightseeing Cruise',
    lat: 51.5007,
    lng: -0.1246,
    radius: 60,
    narration: 'See London\'s iconic landmarks from the Thames on this relaxing sightseeing cruise. Pass Tower Bridge, the London Eye, and historic riverside attractions.',
    description: 'Scenic cruise along the River Thames',
    category: 'Activity',
    detailedDescription: 'A Thames River cruise offers a unique perspective on London\'s most famous landmarks. Glide along the historic waterway that has been the lifeblood of the city for over 2000 years. Your journey takes you past iconic sights including the Tower of London, Tower Bridge, Shakespeare\'s Globe Theatre, the London Eye, Houses of Parliament, and Westminster Abbey. Most cruises offer live or recorded commentary in multiple languages, providing fascinating historical insights and architectural details. Choose from various options: hop-on-hop-off services that let you explore attractions at your own pace, circular cruises for comprehensive sightseeing, or themed experiences like afternoon tea cruises or evening jazz cruises. The open-air upper deck provides perfect photo opportunities and fresh river breezes.',
    photos: [
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
      'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=800',
      'https://images.unsplash.com/photo-1543832923-44667a44c804?w=800',
      'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=800',
      'https://images.unsplash.com/photo-1508711451996-c8cabc35c030?w=800',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800',
      'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800'
    ],
    historicalInfo: 'Thames cruises have been popular since Victorian times when steamboats first offered public river transport.',
    yearBuilt: '19th century',
    architect: 'Various cruise operators',
    translations: {
      en: {
        name: 'Thames River Sightseeing Cruise',
        narration: 'See London\'s iconic landmarks from the Thames on this relaxing sightseeing cruise. Pass Tower Bridge, the London Eye, and historic riverside attractions.',
        description: 'Scenic cruise along the River Thames',
        detailedDescription: 'A Thames River cruise offers a unique perspective on London\'s most famous landmarks. Glide along the historic waterway that has been the lifeblood of the city for over 2000 years. Your journey takes you past iconic sights including the Tower of London, Tower Bridge, Shakespeare\'s Globe Theatre, the London Eye, Houses of Parliament, and Westminster Abbey. Most cruises offer live or recorded commentary in multiple languages, providing fascinating historical insights and architectural details. Choose from various options: hop-on-hop-off services that let you explore attractions at your own pace, circular cruises for comprehensive sightseeing, or themed experiences like afternoon tea cruises or evening jazz cruises. The open-air upper deck provides perfect photo opportunities and fresh river breezes.',
        historicalInfo: 'Thames cruises have been popular since Victorian times when steamboats first offered public river transport.',
        yearBuilt: '19th century',
        architect: 'Various cruise operators'
      },
      it: {
        name: 'Crociera Turistica sul Tamigi',
        narration: 'Ammira i monumenti iconici di Londra dal Tamigi in questa rilassante crociera turistica. Passa il Tower Bridge, il London Eye e le storiche attrazioni lungo il fiume.',
        description: 'Crociera panoramica lungo il fiume Tamigi',
        detailedDescription: 'Una crociera sul fiume Tamigi offre una prospettiva unica sui monumenti più famosi di Londra. Scivola lungo la storica via d\'acqua che è stata la linfa vitale della città per oltre 2000 anni. Il tuo viaggio ti porta davanti a luoghi iconici tra cui la Torre di Londra, il Tower Bridge, il Globe Theatre di Shakespeare, il London Eye, il Parlamento e l\'Abbazia di Westminster. La maggior parte delle crociere offre commenti dal vivo o registrati in più lingue, fornendo affascinanti approfondimenti storici e dettagli architettonici. Scegli tra varie opzioni: servizi hop-on-hop-off che ti permettono di esplorare le attrazioni al tuo ritmo, crociere circolari per un turismo completo o esperienze a tema come crociere con tè pomeridiano o crociere jazz serali. Il ponte superiore all\'aperto offre perfette opportunità fotografiche e fresche brezze fluviali.',
        historicalInfo: 'Le crociere sul Tamigi sono popolari dall\'epoca vittoriana quando i battelli a vapore iniziarono a offrire trasporti fluviali pubblici.',
        yearBuilt: 'XIX secolo',
        architect: 'Vari operatori di crociera'
      },
      ko: {
        name: '템스 강 관광 크루즈',
        narration: '이 편안한 관광 크루즈에서 템스 강에서 런던의 상징적인 랜드마크를 보세요. 타워 브리지, 런던 아이, 역사적인 강변 명소를 지나갑니다.',
        description: '템스 강을 따라 경치 좋은 크루즈',
        detailedDescription: '템스 강 크루즈는 런던의 가장 유명한 랜드마크에 대한 독특한 관점을 제공합니다. 2000년 이상 도시의 생명선이 되어온 역사적인 수로를 따라 미끄러지세요. 여정은 런던 타워, 타워 브리지, 셰익스피어 글로브 극장, 런던 아이, 국회의사당, 웨스트민스터 사원을 포함한 상징적인 명소를 지나갑니다. 대부분의 크루즈는 여러 언어로 라이브 또는 녹음된 해설을 제공하여 매혹적인 역사적 통찰력과 건축적 세부 사항을 제공합니다. 다양한 옵션 중에서 선택하세요: 자신의 속도로 명소를 탐험할 수 있는 홉온홉오프 서비스, 포괄적인 관광을 위한 순환 크루즈, 또는 애프터눈 티 크루즈나 저녁 재즈 크루즈와 같은 테마 체험. 야외 상부 갑판은 완벽한 사진 촬영 기회와 신선한 강바람을 제공합니다.',
        historicalInfo: '템스 강 크루즈는 증기선이 처음 공공 강 운송을 제공한 빅토리아 시대부터 인기를 끌고 있습니다.',
        yearBuilt: '19세기',
        architect: '다양한 크루즈 운영사'
      }
    }
  },
  {
    id: 'afternoon-tea-london',
    cityId: 'london',
    name: 'Traditional Afternoon Tea Experience',
    lat: 51.5074,
    lng: -0.1478,
    radius: 50,
    narration: 'Indulge in a quintessentially British tradition with afternoon tea at a historic London venue. Enjoy delicate sandwiches, scones, and pastries with premium teas.',
    description: 'Classic British afternoon tea at prestigious venue',
    category: 'Activity',
    detailedDescription: 'Experience one of Britain\'s most beloved traditions with afternoon tea at a prestigious London establishment. This elegant ritual, popularized by Anna, the Duchess of Bedford in the 1840s, has become synonymous with British culture. Savor a tiered selection of finger sandwiches (cucumber, smoked salmon, egg mayonnaise), freshly baked scones served warm with clotted cream and jam, and an array of delicate pastries and cakes. Your experience includes a choice of premium loose-leaf teas or, for a special occasion, champagne tea. Venues range from historic hotels like The Ritz and Claridge\'s to charming tea rooms and modern establishments. Dress smartly as most venues enforce a dress code. Booking in advance is essential for popular locations.',
    photos: [
      'https://images.unsplash.com/photo-1519733335390-e2c4c6c2da19?w=800',
      'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800',
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800',
      'https://images.unsplash.com/photo-1580913428706-c311e67898b3?w=800',
      'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=800',
      'https://images.unsplash.com/photo-1556910961-2e3136e55515?w=800',
      'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=800'
    ],
    historicalInfo: 'Afternoon tea was introduced by Anna, Duchess of Bedford in 1840 as a way to curb hunger between lunch and dinner.',
    yearBuilt: '1840',
    architect: 'British culinary tradition',
    translations: {
      en: {
        name: 'Traditional Afternoon Tea Experience',
        narration: 'Indulge in a quintessentially British tradition with afternoon tea at a historic London venue. Enjoy delicate sandwiches, scones, and pastries with premium teas.',
        description: 'Classic British afternoon tea at prestigious venue',
        detailedDescription: 'Experience one of Britain\'s most beloved traditions with afternoon tea at a prestigious London establishment. This elegant ritual, popularized by Anna, the Duchess of Bedford in the 1840s, has become synonymous with British culture. Savor a tiered selection of finger sandwiches (cucumber, smoked salmon, egg mayonnaise), freshly baked scones served warm with clotted cream and jam, and an array of delicate pastries and cakes. Your experience includes a choice of premium loose-leaf teas or, for a special occasion, champagne tea. Venues range from historic hotels like The Ritz and Claridge\'s to charming tea rooms and modern establishments. Dress smartly as most venues enforce a dress code. Booking in advance is essential for popular locations.',
        historicalInfo: 'Afternoon tea was introduced by Anna, Duchess of Bedford in 1840 as a way to curb hunger between lunch and dinner.',
        yearBuilt: '1840',
        architect: 'British culinary tradition'
      },
      it: {
        name: 'Esperienza di Tè Pomeridiano Tradizionale',
        narration: 'Concediti una tradizione tipicamente britannica con il tè pomeridiano in una storica sede londinese. Gusta delicati sandwich, scones e pasticcini con tè premium.',
        description: 'Classico tè pomeridiano britannico in una sede prestigiosa',
        detailedDescription: 'Vivi una delle tradizioni più amate della Gran Bretagna con il tè pomeridiano in un prestigioso locale londinese. Questo elegante rituale, reso popolare da Anna, la Duchessa di Bedford negli anni 1840, è diventato sinonimo di cultura britannica. Assapora una selezione a piani di sandwich finger (cetriolo, salmone affumicato, maionese di uova), scones appena sfornati serviti caldi con clotted cream e marmellata, e una varietà di delicati pasticcini e torte. La tua esperienza include una scelta di tè premium in foglie sfuse o, per un\'occasione speciale, tè con champagne. I locali spaziano da hotel storici come The Ritz e Claridge\'s a incantevoli sale da tè e strutture moderne. Vestiti in modo elegante poiché la maggior parte dei locali applica un codice di abbigliamento. La prenotazione anticipata è essenziale per le località più popolari.',
        historicalInfo: 'Il tè pomeridiano fu introdotto da Anna, Duchessa di Bedford nel 1840 come modo per placare la fame tra pranzo e cena.',
        yearBuilt: '1840',
        architect: 'Tradizione culinaria britannica'
      },
      ko: {
        name: '전통 애프터눈 티 체험',
        narration: '역사적인 런던 장소에서 애프터눈 티로 전형적인 영국 전통을 즐기세요. 프리미엄 차와 함께 섬세한 샌드위치, 스콘, 페이스트리를 즐기세요.',
        description: '명문 장소에서의 클래식 영국 애프터눈 티',
        detailedDescription: '명망 있는 런던 시설에서 애프터눈 티로 영국의 가장 사랑받는 전통 중 하나를 경험하세요. 1840년대 베드포드 공작 부인 애나에 의해 대중화된 이 우아한 의식은 영국 문화의 대명사가 되었습니다. 핑거 샌드위치(오이, 훈제 연어, 달걀 마요네즈)의 계층형 선택, 클로티드 크림과 잼과 함께 따뜻하게 제공되는 갓 구운 스콘, 그리고 섬세한 페이스트리와 케이크의 배열을 맛보세요. 체험에는 프리미엄 잎차 선택 또는 특별한 경우를 위한 샴페인 티가 포함됩니다. 장소는 The Ritz와 Claridge\'s와 같은 역사적인 호텔부터 매력적인 티 룸과 현대적인 시설까지 다양합니다. 대부분의 장소가 드레스 코드를 적용하므로 단정하게 옷을 입으세요. 인기 있는 장소는 사전 예약이 필수입니다.',
        historicalInfo: '애프터눈 티는 1840년 베드포드 공작 부인 애나가 점심과 저녁 사이의 배고픔을 달래기 위한 방법으로 소개했습니다.',
        yearBuilt: '1840',
        architect: '영국 요리 전통'
      }
    }
  },
  {
    id: 'island-hopping-cebu',
    cityId: 'cebu',
    name: 'Island Hopping Adventure',
    lat: 10.3157,
    lng: 123.8854,
    radius: 80,
    narration: 'Explore the stunning islands around Cebu on this full-day island hopping adventure. Visit pristine beaches, snorkel in crystal-clear waters, and discover hidden coves.',
    description: 'Full-day island hopping tour to pristine beaches',
    category: 'Activity',
    detailedDescription: 'Embark on an unforgettable island hopping adventure around Cebu\'s beautiful surrounding islands. This full-day tour typically includes visits to 3-4 islands, each offering unique attractions. Popular destinations include Hilutungan Island with its vibrant marine sanctuary perfect for snorkeling, Nalusuan Island with its long wooden pier and clear waters, and Pandanon Island featuring white sand beaches and shallow turquoise lagoons. Your package usually includes boat transfers, snorkeling equipment, lunch on the beach (fresh grilled seafood and local dishes), and island entrance fees. Expert guides ensure your safety and point out the best spots for swimming, snorkeling, and photography. Witness diverse marine life including colorful tropical fish, sea turtles, and coral reefs.',
    photos: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      'https://images.unsplash.com/photo-1559666126-84f389727b9a?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
      'https://images.unsplash.com/photo-1540202404-d0c7fe46a087?w=800',
      'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800'
    ],
    historicalInfo: 'Island hopping has been a traditional activity in the Philippines for centuries, now a popular tourist experience.',
    yearBuilt: 'Traditional practice',
    architect: 'Philippine maritime culture',
    translations: {
      en: {
        name: 'Island Hopping Adventure',
        narration: 'Explore the stunning islands around Cebu on this full-day island hopping adventure. Visit pristine beaches, snorkel in crystal-clear waters, and discover hidden coves.',
        description: 'Full-day island hopping tour to pristine beaches',
        detailedDescription: 'Embark on an unforgettable island hopping adventure around Cebu\'s beautiful surrounding islands. This full-day tour typically includes visits to 3-4 islands, each offering unique attractions. Popular destinations include Hilutungan Island with its vibrant marine sanctuary perfect for snorkeling, Nalusuan Island with its long wooden pier and clear waters, and Pandanon Island featuring white sand beaches and shallow turquoise lagoons. Your package usually includes boat transfers, snorkeling equipment, lunch on the beach (fresh grilled seafood and local dishes), and island entrance fees. Expert guides ensure your safety and point out the best spots for swimming, snorkeling, and photography. Witness diverse marine life including colorful tropical fish, sea turtles, and coral reefs.',
        historicalInfo: 'Island hopping has been a traditional activity in the Philippines for centuries, now a popular tourist experience.',
        yearBuilt: 'Traditional practice',
        architect: 'Philippine maritime culture'
      },
      it: {
        name: 'Avventura Island Hopping',
        narration: 'Esplora le splendide isole intorno a Cebu in questa avventura di island hopping di un\'intera giornata. Visita spiagge incontaminate, fai snorkeling in acque cristalline e scopri calette nascoste.',
        description: 'Tour di island hopping di un\'intera giornata verso spiagge incontaminate',
        detailedDescription: 'Intraprendi un\'indimenticabile avventura di island hopping intorno alle bellissime isole circostanti di Cebu. Questo tour di un\'intera giornata include tipicamente visite a 3-4 isole, ognuna con attrazioni uniche. Le destinazioni popolari includono l\'isola di Hilutungan con il suo vivace santuario marino perfetto per lo snorkeling, l\'isola di Nalusuan con il suo lungo molo di legno e acque limpide, e l\'isola di Pandanon con spiagge di sabbia bianca e lagune turchesi poco profonde. Il tuo pacchetto include solitamente trasferimenti in barca, attrezzatura per lo snorkeling, pranzo sulla spiaggia (pesce fresco alla griglia e piatti locali) e tariffe d\'ingresso alle isole. Guide esperte garantiscono la tua sicurezza e indicano i migliori luoghi per nuotare, fare snorkeling e fotografare. Ammira la vita marina diversificata tra cui pesci tropicali colorati, tartarughe marine e barriere coralline.',
        historicalInfo: 'L\'island hopping è un\'attività tradizionale nelle Filippine da secoli, ora un\'esperienza turistica popolare.',
        yearBuilt: 'Pratica tradizionale',
        architect: 'Cultura marittima filippina'
      },
      ko: {
        name: '아일랜드 호핑 어드벤처',
        narration: '이 종일 아일랜드 호핑 어드벤처에서 세부 주변의 멋진 섬들을 탐험하세요. 깨끗한 해변을 방문하고, 수정처럼 맑은 물에서 스노클링하며, 숨겨진 만을 발견하세요.',
        description: '깨끗한 해변으로의 종일 아일랜드 호핑 투어',
        detailedDescription: '세부의 아름다운 주변 섬들을 둘러보는 잊을 수 없는 아일랜드 호핑 어드벤처를 떠나세요. 이 종일 투어는 일반적으로 각각 독특한 명소를 제공하는 3-4개의 섬 방문을 포함합니다. 인기 있는 목적지로는 스노클링에 완벽한 활기찬 해양 보호구역이 있는 힐루툰간 섬, 긴 나무 부두와 맑은 물이 있는 날루수안 섬, 그리고 백사장 해변과 얕은 청록색 석호가 특징인 판다논 섬이 있습니다. 패키지에는 일반적으로 보트 이동, 스노클링 장비, 해변에서의 점심 식사(신선한 구운 해산물과 현지 요리), 섬 입장료가 포함됩니다. 전문 가이드가 안전을 보장하고 수영, 스노클링, 사진 촬영을 위한 최고의 장소를 알려줍니다. 형형색색의 열대어, 바다거북, 산호초를 포함한 다양한 해양 생물을 목격하세요.',
        historicalInfo: '아일랜드 호핑은 수세기 동안 필리핀의 전통 활동이었으며, 이제 인기 있는 관광 체험입니다.',
        yearBuilt: '전통 관행',
        architect: '필리핀 해양 문화'
      }
    }
  },
  {
    id: 'whale-shark-watching-cebu',
    cityId: 'cebu',
    name: 'Whale Shark Watching in Oslob',
    lat: 9.5137,
    lng: 123.3823,
    radius: 70,
    narration: 'Swim with gentle giants in Oslob, one of the few places in the world where you can reliably encounter whale sharks year-round.',
    description: 'Once-in-a-lifetime whale shark swimming experience',
    category: 'Activity',
    detailedDescription: 'Experience the thrill of swimming alongside the world\'s largest fish - the gentle whale shark - in the waters of Oslob, southern Cebu. This unique wildlife encounter allows you to snorkel just meters away from these magnificent creatures, some reaching lengths of over 10 meters. Local fishermen have been feeding whale sharks in these waters since 2011, creating a reliable opportunity to see them year-round. Tours begin early morning (starting around 6 AM) when the whale sharks are most active. The experience includes a safety briefing, snorkeling equipment, and a 30-minute session in the water with the whale sharks. Strict regulations protect both visitors and the animals - no touching, flash photography, or sunscreen is allowed. Most tours can be combined with visits to nearby attractions like Tumalog Falls or Sumilon Island.',
    photos: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800',
      'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=800',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=800',
      'https://images.unsplash.com/photo-1559666126-84f389727b9a?w=800',
      'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=800'
    ],
    historicalInfo: 'Whale shark watching in Oslob began in 2011 and has become one of the Philippines\' most popular wildlife encounters.',
    yearBuilt: '2011',
    architect: 'Oslob local community',
    translations: {
      en: {
        name: 'Whale Shark Watching in Oslob',
        narration: 'Swim with gentle giants in Oslob, one of the few places in the world where you can reliably encounter whale sharks year-round.',
        description: 'Once-in-a-lifetime whale shark swimming experience',
        detailedDescription: 'Experience the thrill of swimming alongside the world\'s largest fish - the gentle whale shark - in the waters of Oslob, southern Cebu. This unique wildlife encounter allows you to snorkel just meters away from these magnificent creatures, some reaching lengths of over 10 meters. Local fishermen have been feeding whale sharks in these waters since 2011, creating a reliable opportunity to see them year-round. Tours begin early morning (starting around 6 AM) when the whale sharks are most active. The experience includes a safety briefing, snorkeling equipment, and a 30-minute session in the water with the whale sharks. Strict regulations protect both visitors and the animals - no touching, flash photography, or sunscreen is allowed. Most tours can be combined with visits to nearby attractions like Tumalog Falls or Sumilon Island.',
        historicalInfo: 'Whale shark watching in Oslob began in 2011 and has become one of the Philippines\' most popular wildlife encounters.',
        yearBuilt: '2011',
        architect: 'Oslob local community'
      },
      it: {
        name: 'Osservazione Squali Balena a Oslob',
        narration: 'Nuota con i giganti gentili a Oslob, uno dei pochi posti al mondo dove puoi incontrare squali balena tutto l\'anno in modo affidabile.',
        description: 'Esperienza unica di nuoto con squali balena',
        detailedDescription: 'Vivi l\'emozione di nuotare accanto al pesce più grande del mondo - il gentile squalo balena - nelle acque di Oslob, nel sud di Cebu. Questo unico incontro con la fauna selvatica ti permette di fare snorkeling a pochi metri da queste magnifiche creature, alcune delle quali raggiungono lunghezze superiori ai 10 metri. I pescatori locali alimentano gli squali balena in queste acque dal 2011, creando un\'opportunità affidabile per vederli tutto l\'anno. I tour iniziano al mattino presto (a partire dalle 6 del mattino) quando gli squali balena sono più attivi. L\'esperienza include un briefing sulla sicurezza, attrezzatura per lo snorkeling e una sessione di 30 minuti in acqua con gli squali balena. Regolamenti rigorosi proteggono sia i visitatori che gli animali - non è consentito toccare, fotografare con flash o usare crema solare. La maggior parte dei tour può essere combinata con visite ad attrazioni vicine come le Cascate di Tumalog o l\'isola di Sumilon.',
        historicalInfo: 'L\'osservazione degli squali balena a Oslob è iniziata nel 2011 ed è diventata uno degli incontri con la fauna selvatica più popolari delle Filippine.',
        yearBuilt: '2011',
        architect: 'Comunità locale di Oslob'
      },
      ko: {
        name: '오슬롭 고래상어 관찰',
        narration: '연중 내내 고래상어를 안정적으로 만날 수 있는 세계에서 몇 안 되는 장소 중 하나인 오슬롭에서 온순한 거인들과 함께 수영하세요.',
        description: '일생일대의 고래상어 수영 체험',
        detailedDescription: '세부 남부 오슬롭의 바다에서 세계에서 가장 큰 물고기인 온순한 고래상어와 함께 수영하는 스릴을 경험하세요. 이 독특한 야생 동물 만남은 10미터가 넘는 길이의 웅장한 생물들로부터 불과 몇 미터 떨어진 곳에서 스노클링할 수 있게 해줍니다. 지역 어부들은 2011년부터 이 바다에서 고래상어에게 먹이를 주고 있어 연중 내내 고래상어를 볼 수 있는 안정적인 기회를 제공합니다. 투어는 고래상어가 가장 활발한 이른 아침(오전 6시경 시작)에 시작됩니다. 체험에는 안전 브리핑, 스노클링 장비, 고래상어와 함께 물속에서 보내는 30분 세션이 포함됩니다. 방문객과 동물 모두를 보호하기 위한 엄격한 규정이 있습니다 - 만지기, 플래시 촬영, 선크림 사용이 금지됩니다. 대부분의 투어는 투말록 폭포나 수밀론 섬과 같은 인근 명소 방문과 결합될 수 있습니다.',
        historicalInfo: '오슬롭의 고래상어 관찰은 2011년에 시작되어 필리핀에서 가장 인기 있는 야생 동물 만남 중 하나가 되었습니다.',
        yearBuilt: '2011',
        architect: '오슬롭 지역 사회'
      }
    }
  },
  {
    id: 'singapore-night-safari',
    cityId: 'singapore',
    name: 'Night Safari Experience',
    lat: 1.4043,
    lng: 103.7900,
    radius: 80,
    narration: 'Discover nocturnal wildlife at the world\'s first night safari. Explore themed trails and see over 2,500 animals in their natural nighttime habitat.',
    description: 'World\'s first nocturnal wildlife park experience',
    category: 'Activity',
    detailedDescription: 'The Night Safari offers a unique opportunity to observe nocturnal animals in naturalistic habitats designed to replicate their native environments. Opened in 1994, it was the world\'s first nocturnal zoo and remains one of Singapore\'s most popular attractions. The 35-hectare park houses over 2,500 animals representing more than 130 species, including many threatened and endangered species. Explore via tram ride that takes you through seven geographical zones from the Himalayan Foothills to the jungles of Southeast Asia, or walk along four themed trails for closer encounters. Watch entertaining shows featuring talented animals, and learn about conservation efforts. Special lighting creates an atmospheric moonlit ambiance without disturbing the animals\' natural behaviors. The park opens at 7:15 PM, with the tram rides and walking trails offering different perspectives on wildlife after dark.',
    photos: [
      'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800',
      'https://images.unsplash.com/photo-1549366021-9f761d450615?w=800',
      'https://images.unsplash.com/photo-1534188753412-5fd1b30d5c17?w=800',
      'https://images.unsplash.com/photo-1474314170901-f351b68f544f?w=800',
      'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800',
      'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=800',
      'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800'
    ],
    historicalInfo: 'Opened in 1994 as the world\'s first nocturnal zoo, the Night Safari pioneered the concept of observing wildlife after dark.',
    yearBuilt: '1994',
    architect: 'Bernard Harrison (concept), various wildlife experts',
    translations: {
      en: {
        name: 'Night Safari Experience',
        narration: 'Discover nocturnal wildlife at the world\'s first night safari. Explore themed trails and see over 2,500 animals in their natural nighttime habitat.',
        description: 'World\'s first nocturnal wildlife park experience',
        detailedDescription: 'The Night Safari offers a unique opportunity to observe nocturnal animals in naturalistic habitats designed to replicate their native environments. Opened in 1994, it was the world\'s first nocturnal zoo and remains one of Singapore\'s most popular attractions. The 35-hectare park houses over 2,500 animals representing more than 130 species, including many threatened and endangered species. Explore via tram ride that takes you through seven geographical zones from the Himalayan Foothills to the jungles of Southeast Asia, or walk along four themed trails for closer encounters. Watch entertaining shows featuring talented animals, and learn about conservation efforts. Special lighting creates an atmospheric moonlit ambiance without disturbing the animals\' natural behaviors. The park opens at 7:15 PM, with the tram rides and walking trails offering different perspectives on wildlife after dark.',
        historicalInfo: 'Opened in 1994 as the world\'s first nocturnal zoo, the Night Safari pioneered the concept of observing wildlife after dark.',
        yearBuilt: '1994',
        architect: 'Bernard Harrison (concept), various wildlife experts'
      },
      it: {
        name: 'Esperienza Night Safari',
        narration: 'Scopri la fauna notturna nel primo safari notturno del mondo. Esplora sentieri a tema e osserva oltre 2.500 animali nel loro habitat notturno naturale.',
        description: 'Esperienza del primo parco faunistico notturno del mondo',
        detailedDescription: 'Il Night Safari offre un\'opportunità unica di osservare animali notturni in habitat naturalistici progettati per replicare i loro ambienti nativi. Aperto nel 1994, è stato il primo zoo notturno del mondo e rimane una delle attrazioni più popolari di Singapore. Il parco di 35 ettari ospita oltre 2.500 animali che rappresentano più di 130 specie, comprese molte specie minacciate ed in pericolo. Esplora tramite un giro in tram che ti porta attraverso sette zone geografiche dai piedi dell\'Himalaya alle giungle del Sud-Est asiatico, oppure cammina lungo quattro sentieri tematici per incontri ravvicinati. Guarda spettacoli divertenti con animali talentuosi e scopri gli sforzi di conservazione. L\'illuminazione speciale crea un\'atmosfera lunare suggestiva senza disturbare i comportamenti naturali degli animali. Il parco apre alle 19:15, con i giri in tram e i sentieri a piedi che offrono diverse prospettive sulla fauna selvatica dopo il tramonto.',
        historicalInfo: 'Aperto nel 1994 come primo zoo notturno del mondo, il Night Safari ha aperto la strada al concetto di osservare la fauna selvatica dopo il tramonto.',
        yearBuilt: '1994',
        architect: 'Bernard Harrison (concept), vari esperti di fauna selvatica'
      },
      ko: {
        name: '나이트 사파리 체험',
        narration: '세계 최초의 야간 사파리에서 야행성 야생동물을 발견하세요. 테마별 산책로를 탐험하고 자연적인 야간 서식지에서 2,500마리 이상의 동물을 관찰하세요.',
        description: '세계 최초의 야행성 야생동물 공원 체험',
        detailedDescription: '나이트 사파리는 자연 환경을 재현하도록 설계된 자연주의적 서식지에서 야행성 동물을 관찰할 수 있는 독특한 기회를 제공합니다. 1994년에 개장한 세계 최초의 야간 동물원이며 여전히 싱가포르에서 가장 인기 있는 명소 중 하나입니다. 35헥타르의 공원에는 멸종 위기에 처한 많은 종을 포함하여 130종 이상을 대표하는 2,500마리 이상의 동물이 서식하고 있습니다. 히말라야 산기슭부터 동남아시아 정글까지 7개의 지리적 구역을 통과하는 트램을 타거나, 4개의 테마별 산책로를 따라 걸으며 더 가까이서 만날 수 있습니다. 재능 있는 동물들이 등장하는 재미있는 쇼를 관람하고 보존 노력에 대해 배우세요. 특별한 조명이 동물의 자연스러운 행동을 방해하지 않으면서 분위기 있는 달빛 분위기를 연출합니다. 공원은 오후 7시 15분에 개장하며, 트램 라이드와 도보 산책로는 어두워진 후 야생동물에 대한 다양한 관점을 제공합니다.',
        historicalInfo: '1994년 세계 최초의 야간 동물원으로 개장한 나이트 사파리는 어두워진 후 야생동물을 관찰하는 개념의 선구자입니다.',
        yearBuilt: '1994',
        architect: '버나드 해리슨 (컨셉), 다양한 야생동물 전문가'
      }
    }
  },
  {
    id: 'gardens-light-show-singapore',
    cityId: 'singapore',
    name: 'Gardens by the Bay Light Show',
    lat: 1.2816,
    lng: 103.8636,
    radius: 70,
    narration: 'Experience the spectacular Garden Rhapsody light and sound show at the Supertree Grove. Watch the iconic Supertrees come alive with dazzling lights and music.',
    description: 'Free nightly light and sound show at Supertree Grove',
    category: 'Activity',
    detailedDescription: 'The Garden Rhapsody is a spectacular multimedia show that transforms the iconic Supertree Grove into a mesmerizing display of lights and sound. This free nightly show occurs twice every evening (7:45 PM and 8:45 PM) and lasts about 10-15 minutes. The 16 Supertrees, ranging from 25 to 50 meters tall, are illuminated with a choreographed light display synchronized to music ranging from classical to contemporary. The vertical gardens covering the Supertrees create a stunning backdrop as colors pulse and flow to the rhythm. For the best viewing experience, arrive early to secure a good spot on the grass beneath the Supertrees. You can also watch from the OCBC Skyway, a 128-meter aerial walkway suspended between two Supertrees, offering a unique elevated perspective (separate admission fee applies). The show is family-friendly and completely free, making it one of Singapore\'s most popular evening attractions.',
    photos: [
      'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
      'https://images.unsplash.com/photo-1551802241-a3acdb5ce0b6?w=800',
      'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800',
      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
      'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800',
      'https://images.unsplash.com/photo-1548390453-0d6df5c3d44e?w=800',
      'https://images.unsplash.com/photo-1563535343-836a1c084df8?w=800'
    ],
    historicalInfo: 'The Garden Rhapsody show has been entertaining visitors since Gardens by the Bay opened in 2012.',
    yearBuilt: '2012',
    architect: 'Grant Associates (Supertrees design)',
    translations: {
      en: {
        name: 'Gardens by the Bay Light Show',
        narration: 'Experience the spectacular Garden Rhapsody light and sound show at the Supertree Grove. Watch the iconic Supertrees come alive with dazzling lights and music.',
        description: 'Free nightly light and sound show at Supertree Grove',
        detailedDescription: 'The Garden Rhapsody is a spectacular multimedia show that transforms the iconic Supertree Grove into a mesmerizing display of lights and sound. This free nightly show occurs twice every evening (7:45 PM and 8:45 PM) and lasts about 10-15 minutes. The 16 Supertrees, ranging from 25 to 50 meters tall, are illuminated with a choreographed light display synchronized to music ranging from classical to contemporary. The vertical gardens covering the Supertrees create a stunning backdrop as colors pulse and flow to the rhythm. For the best viewing experience, arrive early to secure a good spot on the grass beneath the Supertrees. You can also watch from the OCBC Skyway, a 128-meter aerial walkway suspended between two Supertrees, offering a unique elevated perspective (separate admission fee applies). The show is family-friendly and completely free, making it one of Singapore\'s most popular evening attractions.',
        historicalInfo: 'The Garden Rhapsody show has been entertaining visitors since Gardens by the Bay opened in 2012.',
        yearBuilt: '2012',
        architect: 'Grant Associates (Supertrees design)'
      },
      it: {
        name: 'Spettacolo di Luci ai Gardens by the Bay',
        narration: 'Vivi lo spettacolare spettacolo di luci e suoni Garden Rhapsody al Supertree Grove. Guarda gli iconici Supertree prendere vita con luci e musica abbaglianti.',
        description: 'Spettacolo gratuito serale di luci e suoni al Supertree Grove',
        detailedDescription: 'Il Garden Rhapsody è uno spettacolo multimediale spettacolare che trasforma l\'iconico Supertree Grove in un affascinante display di luci e suoni. Questo spettacolo serale gratuito si svolge due volte ogni sera (alle 19:45 e alle 20:45) e dura circa 10-15 minuti. I 16 Supertree, alti da 25 a 50 metri, sono illuminati con un display luminoso coreografato sincronizzato con musica che varia dal classico al contemporaneo. I giardini verticali che ricoprono i Supertree creano uno sfondo stupendo mentre i colori pulsano e fluiscono al ritmo. Per la migliore esperienza visiva, arriva presto per assicurarti un buon posto sull\'erba sotto i Supertree. Puoi anche guardare dall\'OCBC Skyway, una passerella aerea di 128 metri sospesa tra due Supertree, che offre una prospettiva elevata unica (si applica una tariffa d\'ingresso separata). Lo spettacolo è adatto alle famiglie e completamente gratuito, rendendolo una delle attrazioni serali più popolari di Singapore.',
        historicalInfo: 'Lo spettacolo Garden Rhapsody intrattiene i visitatori dall\'apertura di Gardens by the Bay nel 2012.',
        yearBuilt: '2012',
        architect: 'Grant Associates (design Supertrees)'
      },
      ko: {
        name: '가든스 바이 더 베이 라이트 쇼',
        narration: '슈퍼트리 그로브에서 장관을 이루는 가든 랩소디 빛과 소리 쇼를 경험하세요. 상징적인 슈퍼트리가 눈부신 조명과 음악으로 생동감 있게 살아나는 것을 보세요.',
        description: '슈퍼트리 그로브의 무료 야간 빛과 소리 쇼',
        detailedDescription: '가든 랩소디는 상징적인 슈퍼트리 그로브를 황홀한 빛과 소리의 디스플레이로 변모시키는 장관을 이루는 멀티미디어 쇼입니다. 이 무료 야간 쇼는 매일 저녁 두 번(오후 7시 45분과 8시 45분)에 열리며 약 10-15분 동안 진행됩니다. 높이가 25~50미터에 달하는 16개의 슈퍼트리는 클래식에서 현대 음악까지 다양한 음악에 맞춰 안무된 조명 디스플레이로 빛납니다. 슈퍼트리를 덮고 있는 수직 정원은 색상이 리듬에 맞춰 맥동하고 흐르는 동안 멋진 배경을 만듭니다. 최고의 감상 경험을 위해 일찍 도착하여 슈퍼트리 아래 잔디밭에서 좋은 자리를 확보하세요. 두 슈퍼트리 사이에 매달린 128미터 공중 보도인 OCBC 스카이웨이에서도 감상할 수 있으며, 독특한 높이의 관점을 제공합니다(별도 입장료 적용). 쇼는 가족 친화적이며 완전히 무료로, 싱가포르에서 가장 인기 있는 저녁 명소 중 하나입니다.',
        historicalInfo: '가든 랩소디 쇼는 2012년 가든스 바이 더 베이가 개장한 이래 방문객들을 즐겁게 해왔습니다.',
        yearBuilt: '2012',
        architect: '그랜트 어소시에이츠 (슈퍼트리 디자인)'
      }
    }
  },
  {
    id: 'penang-street-food-tour',
    cityId: 'penang',
    name: 'Penang Street Food Tour',
    lat: 5.4141,
    lng: 100.3288,
    radius: 60,
    narration: 'Discover Penang\'s legendary street food scene on this guided culinary adventure. Taste iconic dishes and learn about the island\'s unique food heritage.',
    description: 'Guided tour of Penang\'s famous street food',
    category: 'Activity',
    detailedDescription: 'Penang is widely regarded as Malaysia\'s food capital, and this guided street food tour is the best way to experience its incredible culinary diversity. Led by knowledgeable local food experts, you\'ll navigate bustling hawker centers, historic coffee shops, and hidden street stalls to sample Penang\'s most iconic dishes. Taste char kway teow (stir-fried flat rice noodles), assam laksa (spicy-sour fish noodle soup), Hokkien mee, rojak, and countless other specialties. Learn about the unique blend of Malay, Chinese, Indian, and Peranakan influences that created Penang\'s distinctive cuisine. Your guide will explain the history behind each dish, recommend the best stalls, and help you navigate ordering like a local. Tours typically include 8-10 food stops and last 3-4 hours. Come hungry and ready to discover why UNESCO recognized George Town for its exceptional food heritage.',
    photos: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
      'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800',
      'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=800',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
      'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800'
    ],
    historicalInfo: 'Penang\'s food culture developed over centuries through the mixing of diverse ethnic communities and trading influences.',
    yearBuilt: 'Centuries-old tradition',
    architect: 'Multicultural culinary heritage',
    translations: {
      en: {
        name: 'Penang Street Food Tour',
        narration: 'Discover Penang\'s legendary street food scene on this guided culinary adventure. Taste iconic dishes and learn about the island\'s unique food heritage.',
        description: 'Guided tour of Penang\'s famous street food',
        detailedDescription: 'Penang is widely regarded as Malaysia\'s food capital, and this guided street food tour is the best way to experience its incredible culinary diversity. Led by knowledgeable local food experts, you\'ll navigate bustling hawker centers, historic coffee shops, and hidden street stalls to sample Penang\'s most iconic dishes. Taste char kway teow (stir-fried flat rice noodles), assam laksa (spicy-sour fish noodle soup), Hokkien mee, rojak, and countless other specialties. Learn about the unique blend of Malay, Chinese, Indian, and Peranakan influences that created Penang\'s distinctive cuisine. Your guide will explain the history behind each dish, recommend the best stalls, and help you navigate ordering like a local. Tours typically include 8-10 food stops and last 3-4 hours. Come hungry and ready to discover why UNESCO recognized George Town for its exceptional food heritage.',
        historicalInfo: 'Penang\'s food culture developed over centuries through the mixing of diverse ethnic communities and trading influences.',
        yearBuilt: 'Centuries-old tradition',
        architect: 'Multicultural culinary heritage'
      },
      it: {
        name: 'Tour dello Street Food di Penang',
        narration: 'Scopri la leggendaria scena dello street food di Penang in questa avventura culinaria guidata. Assaggia piatti iconici e impara l\'eredità alimentare unica dell\'isola.',
        description: 'Tour guidato del famoso street food di Penang',
        detailedDescription: 'Penang è ampiamente considerata la capitale gastronomica della Malesia, e questo tour guidato dello street food è il modo migliore per sperimentare la sua incredibile diversità culinaria. Guidati da esperti di cibo locali ben informati, navigherai tra centri di venditori ambulanti affollati, caffetterie storiche e bancarelle di strada nascoste per assaggiare i piatti più iconici di Penang. Assapora char kway teow (tagliatelle di riso piatte saltate in padella), assam laksa (zuppa di noodles di pesce piccante-acida), Hokkien mee, rojak e innumerevoli altre specialità. Impara la miscela unica di influenze malesi, cinesi, indiane e Peranakan che ha creato la cucina distintiva di Penang. La tua guida spiegherà la storia dietro ogni piatto, consiglierà le migliori bancarelle e ti aiuterà a ordinare come un locale. I tour includono tipicamente 8-10 tappe gastronomiche e durano 3-4 ore. Vieni affamato e pronto a scoprire perché l\'UNESCO ha riconosciuto George Town per il suo eccezionale patrimonio gastronomico.',
        historicalInfo: 'La cultura alimentare di Penang si è sviluppata nel corso dei secoli attraverso la mescolanza di diverse comunità etniche e influenze commerciali.',
        yearBuilt: 'Tradizione secolare',
        architect: 'Patrimonio culinario multiculturale'
      },
      ko: {
        name: '페낭 스트리트 푸드 투어',
        narration: '이 가이드 요리 모험에서 페낭의 전설적인 스트리트 푸드 장면을 발견하세요. 상징적인 요리를 맛보고 섬의 독특한 음식 유산에 대해 배우세요.',
        description: '페낭의 유명한 스트리트 푸드 가이드 투어',
        detailedDescription: '페낭은 말레이시아의 음식 수도로 널리 알려져 있으며, 이 가이드 스트리트 푸드 투어는 놀라운 요리 다양성을 경험할 수 있는 최고의 방법입니다. 지식이 풍부한 현지 음식 전문가가 이끄는 이 투어에서 붐비는 호커 센터, 역사적인 커피숍, 숨겨진 거리 노점을 탐색하며 페낭의 가장 상징적인 요리를 맛볼 수 있습니다. 차 퀘이 티오(볶은 납작 쌀국수), 아삼 락사(매콤하고 신 생선 국수 수프), 호키엔 미, 로작 및 수많은 다른 특선 요리를 맛보세요. 페낭의 독특한 요리를 만든 말레이, 중국, 인도, 페라나칸 영향의 독특한 혼합에 대해 배우세요. 가이드가 각 요리의 역사를 설명하고, 최고의 노점을 추천하며, 현지인처럼 주문하는 방법을 도와줍니다. 투어는 일반적으로 8-10개의 음식 정거장을 포함하며 3-4시간 동안 진행됩니다. 배고픈 상태로 와서 유네스코가 조지타운을 탁월한 음식 유산으로 인정한 이유를 발견할 준비를 하세요.',
        historicalInfo: '페낭의 음식 문화는 다양한 민족 공동체와 무역 영향의 혼합을 통해 수세기에 걸쳐 발전했습니다.',
        yearBuilt: '수세기 된 전통',
        architect: '다문화 요리 유산'
      }
    }
  },
  {
    id: 'penang-trishaw-tour',
    cityId: 'penang',
    name: 'Heritage Trishaw Tour',
    lat: 5.4164,
    lng: 100.3327,
    radius: 50,
    narration: 'Explore George Town\'s UNESCO heritage sites on a traditional trishaw ride. Discover colorful street art, historic architecture, and cultural landmarks.',
    description: 'Traditional trishaw tour of George Town heritage sites',
    category: 'Activity',
    detailedDescription: 'Experience George Town\'s UNESCO World Heritage Site in the most charming way possible - aboard a traditional trishaw. These three-wheeled bicycle taxis have been a Penang icon for decades and offer a leisurely, eco-friendly way to explore the historic city center. Your trishaw rider, often a knowledgeable local, will pedal you through narrow lanes and bustling streets, stopping at key heritage sites, clan houses, temples, and the famous street art murals that have made Penang Instagram-famous. Tours typically last 30 minutes to 2 hours and can be customized to your interests. Many trishaws are decorated with colorful flowers, flags, and lights, creating a festive atmosphere. This is particularly magical in the evening when the heritage buildings are lit up. Learn about Penang\'s Peranakan culture, colonial history, and multicultural heritage while enjoying the breeze and unique street-level perspectives.',
    photos: [
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800',
      'https://images.unsplash.com/photo-1572655275173-eac676e8f05d?w=800',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800',
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
      'https://images.unsplash.com/photo-1551636898-47668aa61de2?w=800',
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=800',
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800'
    ],
    historicalInfo: 'Trishaws have been operating in Penang since the 1940s and remain an iconic mode of transport and tourism.',
    yearBuilt: '1940s',
    architect: 'Traditional Penang transport heritage',
    translations: {
      en: {
        name: 'Heritage Trishaw Tour',
        narration: 'Explore George Town\'s UNESCO heritage sites on a traditional trishaw ride. Discover colorful street art, historic architecture, and cultural landmarks.',
        description: 'Traditional trishaw tour of George Town heritage sites',
        detailedDescription: 'Experience George Town\'s UNESCO World Heritage Site in the most charming way possible - aboard a traditional trishaw. These three-wheeled bicycle taxis have been a Penang icon for decades and offer a leisurely, eco-friendly way to explore the historic city center. Your trishaw rider, often a knowledgeable local, will pedal you through narrow lanes and bustling streets, stopping at key heritage sites, clan houses, temples, and the famous street art murals that have made Penang Instagram-famous. Tours typically last 30 minutes to 2 hours and can be customized to your interests. Many trishaws are decorated with colorful flowers, flags, and lights, creating a festive atmosphere. This is particularly magical in the evening when the heritage buildings are lit up. Learn about Penang\'s Peranakan culture, colonial history, and multicultural heritage while enjoying the breeze and unique street-level perspectives.',
        historicalInfo: 'Trishaws have been operating in Penang since the 1940s and remain an iconic mode of transport and tourism.',
        yearBuilt: '1940s',
        architect: 'Traditional Penang transport heritage'
      },
      it: {
        name: 'Tour Heritage in Trishaw',
        narration: 'Esplora i siti del patrimonio UNESCO di George Town su un tradizionale giro in trishaw. Scopri colorata street art, architettura storica e punti di riferimento culturali.',
        description: 'Tour tradizionale in trishaw dei siti del patrimonio di George Town',
        detailedDescription: 'Vivi il sito del Patrimonio Mondiale UNESCO di George Town nel modo più affascinante possibile - a bordo di un trishaw tradizionale. Questi taxi bicicletta a tre ruote sono stati un\'icona di Penang per decenni e offrono un modo piacevole ed ecologico per esplorare il centro storico della città. Il tuo conducente di trishaw, spesso un locale ben informato, ti porterà attraverso vicoli stretti e strade affollate, fermandosi nei principali siti del patrimonio, case di clan, templi e i famosi murales di street art che hanno reso Penang famosa su Instagram. I tour durano tipicamente da 30 minuti a 2 ore e possono essere personalizzati secondo i tuoi interessi. Molti trishaw sono decorati con fiori colorati, bandiere e luci, creando un\'atmosfera festiva. Questo è particolarmente magico la sera quando gli edifici del patrimonio sono illuminati. Impara la cultura Peranakan di Penang, la storia coloniale e il patrimonio multiculturale mentre godi della brezza e delle prospettive uniche a livello della strada.',
        historicalInfo: 'I trishaw operano a Penang dagli anni \'40 e rimangono un mezzo di trasporto e turismo iconico.',
        yearBuilt: 'Anni \'40',
        architect: 'Patrimonio del trasporto tradizionale di Penang'
      },
      ko: {
        name: '헤리티지 트라이쇼 투어',
        narration: '전통 트라이쇼를 타고 조지타운의 유네스코 유산 지역을 탐험하세요. 화려한 거리 예술, 역사적 건축물, 문화 랜드마크를 발견하세요.',
        description: '조지타운 유산 지역의 전통 트라이쇼 투어',
        detailedDescription: '가능한 가장 매력적인 방법으로 조지타운의 유네스코 세계 유산 지역을 경험하세요 - 전통 트라이쇼를 타고. 이 세 바퀴 자전거 택시는 수십 년 동안 페낭의 아이콘이었으며 역사적인 도심을 탐험할 수 있는 여유롭고 친환경적인 방법을 제공합니다. 종종 지식이 풍부한 현지인인 트라이쇼 운전사가 좁은 골목과 붐비는 거리를 통해 당신을 페달로 이동시키며, 주요 유산 지역, 씨족 가옥, 사원, 그리고 페낭을 인스타그램으로 유명하게 만든 유명한 거리 예술 벽화에서 멈춥니다. 투어는 일반적으로 30분에서 2시간 동안 진행되며 관심사에 맞게 맞춤화할 수 있습니다. 많은 트라이쇼는 화려한 꽃, 깃발, 조명으로 장식되어 축제 분위기를 조성합니다. 유산 건물이 조명을 받는 저녁에는 특히 마법 같습니다. 바람을 즐기고 독특한 거리 수준의 관점을 즐기면서 페낭의 페라나칸 문화, 식민지 역사, 다문화 유산에 대해 배우세요.',
        historicalInfo: '트라이쇼는 1940년대부터 페낭에서 운영되어 왔으며 여전히 상징적인 교통 및 관광 수단입니다.',
        yearBuilt: '1940년대',
        architect: '페낭 전통 운송 유산'
      }
    }
  },
  {
    id: 'batu-caves-tour-kl',
    cityId: 'kuala-lumpur',
    name: 'Batu Caves Cultural Tour',
    lat: 3.2379,
    lng: 101.6841,
    radius: 70,
    narration: 'Experience the spiritual wonder of Batu Caves, a limestone hill with ancient Hindu temples. Climb the famous 272 colorful steps and meet friendly monkeys.',
    description: 'Cultural tour of sacred Batu Caves Hindu temple',
    category: 'Activity',
    detailedDescription: 'Batu Caves is one of Malaysia\'s most iconic Hindu shrines and a spectacular natural wonder. This half-day tour takes you to the 400-million-year-old limestone caves located just outside Kuala Lumpur. The journey begins with the impressive sight of the 42.7-meter golden statue of Lord Murugan, the world\'s tallest statue of a Hindu deity. Climb the famous 272 rainbow-colored steps (painted in 2018) to reach the main Temple Cave, a cathedral-sized cavern housing several Hindu shrines. Inside, shafts of natural light pierce through openings in the limestone ceiling, creating an ethereal atmosphere. Your guide will explain the religious significance of the site and its annual Thaipusam festival, which attracts over one million devotees. The caves are also home to a troop of long-tailed macaque monkeys - keep your belongings secure! Tours typically include transport, guide, and entrance fees.',
    photos: [
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800',
      'https://images.unsplash.com/photo-1580998914224-cbdec8e48e11?w=800',
      'https://images.unsplash.com/photo-1564760290292-23341e4df6ec?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=800',
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800',
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800'
    ],
    historicalInfo: 'Batu Caves was promoted as a Hindu shrine by Indian trader K. Thamboosamy Pillai in 1891. The Thaipusam festival has been celebrated here since 1892.',
    yearBuilt: '1891',
    architect: 'K. Thamboosamy Pillai (shrine founder)',
    translations: {
      en: {
        name: 'Batu Caves Cultural Tour',
        narration: 'Experience the spiritual wonder of Batu Caves, a limestone hill with ancient Hindu temples. Climb the famous 272 colorful steps and meet friendly monkeys.',
        description: 'Cultural tour of sacred Batu Caves Hindu temple',
        historicalInfo: 'Batu Caves was promoted as a Hindu shrine by Indian trader K. Thamboosamy Pillai in 1891. The Thaipusam festival has been celebrated here since 1892.',
        yearBuilt: '1891',
        architect: 'K. Thamboosamy Pillai (shrine founder)'
      },
      it: {
        name: 'Tour Culturale delle Batu Caves',
        narration: 'Vivi la meraviglia spirituale delle Batu Caves, una collina calcarea con antichi templi indù. Sali i famosi 272 gradini colorati e incontra simpatiche scimmie.',
        description: 'Tour culturale del sacro tempio indù Batu Caves',
        historicalInfo: 'Le Batu Caves furono promosse come santuario indù dal commerciante indiano K. Thamboosamy Pillai nel 1891. Il festival Thaipusam si celebra qui dal 1892.',
        yearBuilt: '1891',
        architect: 'K. Thamboosamy Pillai (fondatore del santuario)'
      },
      ko: {
        name: '바투 동굴 문화 투어',
        narration: '고대 힌두교 사원이 있는 석회암 언덕 바투 동굴의 영적 경이로움을 경험하세요. 유명한 272개의 화려한 계단을 오르고 친근한 원숭이를 만나세요.',
        description: '신성한 바투 동굴 힌두교 사원 문화 투어',
        historicalInfo: '바투 동굴은 1891년 인도 상인 K. Thamboosamy Pillai에 의해 힌두교 성지로 홍보되었습니다. 타이푸삼 축제는 1892년부터 이곳에서 기념되어 왔습니다.',
        yearBuilt: '1891',
        architect: 'K. Thamboosamy Pillai (성지 설립자)'
      }
    }
  },
  {
    id: 'chinatown-night-market-kl',
    cityId: 'kuala-lumpur',
    name: 'Chinatown Night Market Walk',
    lat: 3.1412,
    lng: 101.6953,
    radius: 60,
    narration: 'Explore the vibrant Petaling Street night market in Kuala Lumpur\'s historic Chinatown. Shop for souvenirs, taste local street food, and soak in the lively atmosphere.',
    description: 'Evening walking tour of bustling Chinatown market',
    category: 'Activity',
    detailedDescription: 'Petaling Street, the heart of Kuala Lumpur\'s Chinatown, transforms into a bustling night market every evening, offering an authentic Malaysian shopping and dining experience. This guided walking tour takes you through the covered market street where hundreds of stalls sell everything from clothing, accessories, and souvenirs to local delicacies and street food. Your knowledgeable guide will help you navigate the maze of vendors, share bargaining tips, and recommend the best food stalls. Taste local favorites like char kway teow, Hokkien mee, clay pot chicken rice, and refreshing sugar cane juice. Learn about the area\'s history as a tin mining settlement and its transformation into a vibrant Chinese community. The tour also includes visits to nearby heritage sites like the ornate Sri Mahamariamman Hindu Temple, Chan See Shu Yuen Clan Temple, and traditional medicine halls. The market\'s neon lights and energetic atmosphere create perfect photo opportunities.',
    photos: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
      'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800',
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800',
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=800'
    ],
    historicalInfo: 'Petaling Street has been the center of KL\'s Chinese community since the 1880s during the tin mining boom.',
    yearBuilt: '1880s',
    architect: 'Historical Chinese settlement',
    translations: {
      en: {
        name: 'Chinatown Night Market Walk',
        narration: 'Explore the vibrant Petaling Street night market in Kuala Lumpur\'s historic Chinatown. Shop for souvenirs, taste local street food, and soak in the lively atmosphere.',
        description: 'Evening walking tour of bustling Chinatown market',
        historicalInfo: 'Petaling Street has been the center of KL\'s Chinese community since the 1880s during the tin mining boom.',
        yearBuilt: '1880s',
        architect: 'Historical Chinese settlement'
      },
      it: {
        name: 'Passeggiata al Mercato Notturno di Chinatown',
        narration: 'Esplora il vivace mercato notturno di Petaling Street nella storica Chinatown di Kuala Lumpur. Acquista souvenir, assaggia lo street food locale e immergiti nell\'atmosfera vivace.',
        description: 'Tour serale a piedi del vivace mercato di Chinatown',
        historicalInfo: 'Petaling Street è il centro della comunità cinese di KL dagli anni 1880 durante il boom dell\'estrazione dello stagno.',
        yearBuilt: 'Anni 1880',
        architect: 'Insediamento cinese storico'
      },
      ko: {
        name: '차이나타운 야시장 산책',
        narration: '쿠알라룸푸르의 역사적인 차이나타운에 있는 활기찬 페탈링 거리 야시장을 탐험하세요. 기념품을 쇼핑하고, 현지 스트리트 푸드를 맛보며, 활기찬 분위기에 흠뻑 빠지세요.',
        description: '번화한 차이나타운 시장의 저녁 도보 투어',
        historicalInfo: '페탈링 거리는 1880년대 주석 채굴 붐 동안부터 KL 중국 커뮤니티의 중심이었습니다.',
        yearBuilt: '1880년대',
        architect: '역사적 중국인 정착지'
      }
    }
  },
  {
    id: 'phuket-snorkeling-tour',
    cityId: 'phuket',
    name: 'Coral Island Snorkeling Tour',
    lat: 7.7394,
    lng: 98.3565,
    radius: 80,
    narration: 'Discover vibrant underwater life on this snorkeling tour to Coral Island. Swim in crystal-clear waters and explore colorful coral reefs teeming with tropical fish.',
    description: 'Full-day snorkeling adventure at Coral Island',
    category: 'Activity',
    detailedDescription: 'Escape to the paradise of Coral Island (Koh Hae), located just 15 minutes by speedboat from Phuket. This full-day snorkeling tour offers the perfect introduction to the Andaman Sea\'s underwater wonders. The island\'s two main beaches, Long Beach and Banana Beach, feature shallow, calm waters ideal for snorkeling. Explore vibrant coral gardens filled with colorful tropical fish, sea anemones, and other marine life. The tour typically includes snorkeling equipment, life jackets, expert guides, and a delicious Thai lunch on the beach. Between snorkeling sessions, relax on the white sand beaches, swim in the crystal-clear turquoise waters, or try optional water sports like parasailing and banana boat rides (additional fees apply). The tour usually departs around 8:30 AM and returns by 4:00 PM, allowing plenty of time to explore both underwater and above-water activities. Hotel pickup and drop-off are included from most areas of Phuket.',
    photos: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      'https://images.unsplash.com/photo-1559666126-84f389727b9a?w=800',
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
      'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800'
    ],
    historicalInfo: 'Coral Island has been a popular day trip destination from Phuket for decades, known for its accessible snorkeling.',
    yearBuilt: 'Natural formation',
    architect: 'Nature',
    translations: {
      en: {
        name: 'Coral Island Snorkeling Tour',
        narration: 'Discover vibrant underwater life on this snorkeling tour to Coral Island. Swim in crystal-clear waters and explore colorful coral reefs teeming with tropical fish.',
        description: 'Full-day snorkeling adventure at Coral Island',
        historicalInfo: 'Coral Island has been a popular day trip destination from Phuket for decades, known for its accessible snorkeling.',
        yearBuilt: 'Natural formation',
        architect: 'Nature'
      },
      it: {
        name: 'Tour Snorkeling a Coral Island',
        narration: 'Scopri la vivace vita sottomarina in questo tour di snorkeling a Coral Island. Nuota in acque cristalline ed esplora barriere coralline colorate brulicanti di pesci tropicali.',
        description: 'Avventura di snorkeling di un\'intera giornata a Coral Island',
        historicalInfo: 'Coral Island è stata una popolare destinazione per gite di un giorno da Phuket per decenni, conosciuta per il suo snorkeling accessibile.',
        yearBuilt: 'Formazione naturale',
        architect: 'Natura'
      },
      ko: {
        name: '코랄 아일랜드 스노클링 투어',
        narration: '코랄 아일랜드로의 이 스노클링 투어에서 생동감 넘치는 수중 생물을 발견하세요. 수정처럼 맑은 물에서 수영하고 열대어로 가득한 화려한 산호초를 탐험하세요.',
        description: '코랄 아일랜드에서의 종일 스노클링 어드벤처',
        historicalInfo: '코랄 아일랜드는 수십 년 동안 푸켓에서의 인기 있는 당일치기 여행지로, 접근하기 쉬운 스노클링으로 유명합니다.',
        yearBuilt: '자연 형성',
        architect: '자연'
      }
    }
  },
  {
    id: 'phuket-sunset-cruise',
    cityId: 'phuket',
    name: 'Phang Nga Bay Sunset Cruise',
    lat: 8.2762,
    lng: 98.5016,
    radius: 90,
    narration: 'Experience the magic of Phang Nga Bay on this romantic sunset cruise. Sail past dramatic limestone karsts, visit James Bond Island, and watch the sunset over the Andaman Sea.',
    description: 'Romantic sunset cruise through Phang Nga Bay',
    category: 'Activity',
    detailedDescription: 'Phang Nga Bay is one of Thailand\'s most stunning natural wonders, and a sunset cruise is the perfect way to experience its beauty. This tour takes you through the bay\'s spectacular landscape of towering limestone karsts rising dramatically from emerald-green waters. Visit the famous James Bond Island (Khao Phing Kan), made world-famous by the 1974 movie "The Man with the Golden Gun." Explore mysterious sea caves by kayak or long-tail boat, including the atmospheric Tham Lod cave system. Many tours include a stop at Koh Panyee, a remarkable Muslim fishing village built entirely on stilts over the water, where you\'ll enjoy a delicious Thai seafood dinner. As the day draws to a close, find a perfect spot on deck to watch the sun set over the bay, painting the limestone cliffs in golden hues. The cruise typically includes hotel transfers, guide, meals, and kayaking equipment. Most tours depart in the afternoon and return after dark, creating a magical experience.',
    photos: [
      'https://images.unsplash.com/photo-1552055568-3b8d96892c4e?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=800',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800',
      'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
      'https://images.unsplash.com/photo-1559666126-84f389727b9a?w=800'
    ],
    historicalInfo: 'Phang Nga Bay became internationally famous after appearing in the James Bond film in 1974.',
    yearBuilt: 'Ancient geological formation',
    architect: 'Millions of years of natural formation',
    translations: {
      en: {
        name: 'Phang Nga Bay Sunset Cruise',
        narration: 'Experience the magic of Phang Nga Bay on this romantic sunset cruise. Sail past dramatic limestone karsts, visit James Bond Island, and watch the sunset over the Andaman Sea.',
        description: 'Romantic sunset cruise through Phang Nga Bay',
        historicalInfo: 'Phang Nga Bay became internationally famous after appearing in the James Bond film in 1974.',
        yearBuilt: 'Ancient geological formation',
        architect: 'Millions of years of natural formation'
      },
      it: {
        name: 'Crociera al Tramonto nella Baia di Phang Nga',
        narration: 'Vivi la magia della Baia di Phang Nga in questa romantica crociera al tramonto. Naviga accanto a drammatici karst calcarei, visita l\'Isola di James Bond e guarda il tramonto sul Mare delle Andamane.',
        description: 'Crociera romantica al tramonto attraverso la Baia di Phang Nga',
        historicalInfo: 'La Baia di Phang Nga divenne famosa a livello internazionale dopo essere apparsa nel film di James Bond nel 1974.',
        yearBuilt: 'Formazione geologica antica',
        architect: 'Milioni di anni di formazione naturale'
      },
      ko: {
        name: '팡아 만 선셋 크루즈',
        narration: '이 낭만적인 선셋 크루즈에서 팡아 만의 마법을 경험하세요. 극적인 석회암 카르스트를 지나 항해하고, 제임스 본드 섬을 방문하며, 안다만 해 위로 지는 석양을 감상하세요.',
        description: '팡아 만을 통한 낭만적인 선셋 크루즈',
        historicalInfo: '팡아 만은 1974년 제임스 본드 영화에 등장한 후 국제적으로 유명해졌습니다.',
        yearBuilt: '고대 지질학적 형성',
        architect: '수백만 년의 자연 형성'
      }
    }
  },
  // Additional Rome Activities
  {
    id: 'colosseum-underground-tour',
    cityId: 'rome',
    name: 'Colosseum Underground Tour',
    lat: 41.8902,
    lng: 12.4922,
    radius: 70,
    narration: 'Explore the hidden underground chambers of the Colosseum where gladiators once prepared for battle. This exclusive tour takes you beneath the arena floor.',
    description: 'Exclusive underground tour of Colosseum chambers and arena floor',
    category: 'Activity',
    detailedDescription: 'This special access tour takes you into the normally restricted underground hypogeum of the Colosseum, where gladiators and wild animals waited before entering the arena. Walk on the reconstructed arena floor for a gladiator\'s-eye view of the amphitheater, then descend into the underground chambers to see the complex system of tunnels, rooms, and mechanical lifts that created the spectacular shows. Your expert guide brings ancient Rome to life with stories of gladiatorial combat, exotic animal hunts, and the engineering marvels that made it all possible. The tour also includes access to the upper tiers for panoramic views of the Roman Forum.',
    photos: [
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800',
      'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800',
      'https://images.unsplash.com/photo-1548585744-4e87a0e84c88?w=800'
    ],
    historicalInfo: 'The Colosseum underground was covered with sand during events to absorb blood and provide traction for fighters.',
    yearBuilt: '70-80 AD',
    architect: 'Roman engineers',
    translations: {
      en: {
        name: 'Colosseum Underground Tour',
        narration: 'Explore the hidden underground chambers of the Colosseum where gladiators once prepared for battle. This exclusive tour takes you beneath the arena floor.',
        description: 'Exclusive underground tour of Colosseum chambers and arena floor',
        historicalInfo: 'The Colosseum underground was covered with sand during events to absorb blood and provide traction for fighters.',
        yearBuilt: '70-80 AD',
        architect: 'Roman engineers'
      },
      it: {
        name: 'Tour del Colosseo Sotterraneo',
        narration: 'Esplora le camere sotterranee nascoste del Colosseo dove i gladiatori si preparavano per la battaglia. Questo tour esclusivo ti porta sotto il pavimento dell\'arena.',
        description: 'Tour esclusivo sotterraneo delle camere del Colosseo e del pavimento dell\'arena',
        historicalInfo: 'Il sotterraneo del Colosseo era coperto di sabbia durante gli eventi per assorbire il sangue e fornire trazione ai combattenti.',
        yearBuilt: '70-80 d.C.',
        architect: 'Ingegneri romani'
      },
      ko: {
        name: '콜로세움 지하 투어',
        narration: '검투사들이 전투를 준비했던 콜로세움의 숨겨진 지하 방을 탐험하세요. 이 독점 투어는 아레나 바닥 아래로 안내합니다.',
        description: '콜로세움 지하 및 아레나 바닥 독점 투어',
        historicalInfo: '콜로세움 지하는 행사 중 피를 흡수하고 전사들에게 견인력을 제공하기 위해 모래로 덮였습니다.',
        yearBuilt: '서기 70-80년',
        architect: '로마 엔지니어'
      },
      es: {
        name: 'Tour Subterráneo del Coliseo',
        narration: 'Explore las cámaras subterráneas ocultas del Coliseo donde los gladiadores se preparaban para la batalla. Este tour exclusivo le lleva bajo el suelo de la arena.',
        description: 'Tour exclusivo de las cámaras subterráneas del Coliseo y el suelo de la arena',
        detailedDescription: 'Este tour de acceso especial le lleva al hipogeo subterráneo normalmente restringido del Coliseo, donde gladiadores y animales salvajes esperaban antes de entrar a la arena. Camine por el suelo reconstruido de la arena para ver el anfiteatro desde la perspectiva de un gladiador, luego descienda a las cámaras subterráneas para ver el complejo sistema de túneles, salas y elevadores mecánicos que creaban los espectáculos.'
      },
      fr: {
        name: 'Visite Souterraine du Colisée',
        narration: 'Explorez les chambres souterraines cachées du Colisée où les gladiateurs se préparaient au combat. Cette visite exclusive vous emmène sous le sol de l\'arène.',
        description: 'Visite exclusive des chambres souterraines du Colisée et du sol de l\'arène',
        detailedDescription: 'Cette visite à accès spécial vous emmène dans l\'hypogée souterrain normalement interdit du Colisée, où gladiateurs et animaux sauvages attendaient avant d\'entrer dans l\'arène. Marchez sur le sol reconstitué de l\'arène pour une vue de gladiateur de l\'amphithéâtre, puis descendez dans les chambres souterraines pour voir le système complexe de tunnels, de salles et d\'ascenseurs mécaniques qui créaient les spectacles.'
      },
      de: {
        name: 'Kolosseum Untergrund-Tour',
        narration: 'Erkunden Sie die verborgenen unterirdischen Kammern des Kolosseums, wo Gladiatoren sich auf den Kampf vorbereiteten. Diese exklusive Tour führt Sie unter den Arenaboden.',
        description: 'Exklusive Tour durch die unterirdischen Kammern des Kolosseums und den Arenaboden',
        detailedDescription: 'Diese Sonderzugangs-Tour führt Sie in das normalerweise gesperrte unterirdische Hypogäum des Kolosseums, wo Gladiatoren und wilde Tiere warteten, bevor sie die Arena betraten. Gehen Sie über den rekonstruierten Arenaboden für einen Gladiatorenblick auf das Amphitheater, dann steigen Sie in die unterirdischen Kammern hinab, um das komplexe System aus Tunneln, Räumen und mechanischen Aufzügen zu sehen.'
      },
      zh: {
        name: '斗兽场地下之旅',
        narration: '探索斗兽场隐藏的地下房间，这里曾是角斗士准备战斗的地方。这次独家之旅将带您进入竞技场地板下方。',
        description: '斗兽场地下室和竞技场地板独家之旅',
        detailedDescription: '这次特别通道之旅将带您进入通常禁止进入的斗兽场地下区域，角斗士和野生动物曾在这里等待进入竞技场。走在重建的竞技场地板上，从角斗士的视角观看圆形剧场，然后进入地下房间，观看创造壮观表演的复杂隧道、房间和机械升降机系统。'
      },
      ja: {
        name: 'コロッセオ地下ツアー',
        narration: '剣闘士が戦いの準備をしていたコロッセオの隠された地下室を探検してください。この独占ツアーでは、アリーナの床の下へご案内します。',
        description: 'コロッセオの地下室とアリーナフロアの独占ツアー',
        detailedDescription: 'この特別アクセスツアーでは、通常は立入禁止のコロッセオの地下ヒポゲウムに入ります。ここでは剣闘士や野生動物がアリーナに入る前に待機していました。再建されたアリーナフロアを歩いて剣闘士の視点から円形闘技場を見渡し、その後地下室に降りて、壮大なショーを生み出した複雑なトンネル、部屋、機械式リフトのシステムを見学します。'
      },
      pt: {
        name: 'Tour Subterrâneo do Coliseu',
        narration: 'Explore as câmaras subterrâneas escondidas do Coliseu onde os gladiadores se preparavam para a batalha. Este tour exclusivo leva você sob o chão da arena.',
        description: 'Tour exclusivo das câmaras subterrâneas do Coliseu e do chão da arena',
        detailedDescription: 'Este tour de acesso especial leva você ao hipogeu subterrâneo normalmente restrito do Coliseu, onde gladiadores e animais selvagens esperavam antes de entrar na arena. Caminhe pelo chão reconstruído da arena para uma visão de gladiador do anfiteatro, depois desça às câmaras subterrâneas para ver o complexo sistema de túneis, salas e elevadores mecânicos que criavam os espetáculos.'
      },
      ru: {
        name: 'Подземный Тур по Колизею',
        narration: 'Исследуйте скрытые подземные камеры Колизея, где гладиаторы готовились к бою. Этот эксклюзивный тур проведет вас под пол арены.',
        description: 'Эксклюзивный тур по подземным камерам Колизея и полу арены',
        detailedDescription: 'Этот тур со специальным доступом проведет вас в обычно закрытый подземный гипогей Колизея, где гладиаторы и дикие животные ждали перед выходом на арену. Пройдите по реконструированному полу арены, чтобы увидеть амфитеатр глазами гладиатора, затем спуститесь в подземные камеры, чтобы увидеть сложную систему туннелей, комнат и механических лифтов.'
      },
    }
  },
  {
    id: 'rome-vespa-tour',
    cityId: 'rome',
    name: 'Vespa Tour of Rome',
    lat: 41.9028,
    lng: 12.4964,
    radius: 80,
    narration: 'Experience Rome like a local on a vintage Vespa scooter. Cruise through historic streets and discover hidden gems with an expert guide.',
    description: 'Guided Vespa tour through Rome\'s historic streets',
    category: 'Activity',
    detailedDescription: 'Feel the thrill of riding a classic Italian Vespa through the Eternal City on this unforgettable tour. Your adventure begins with a safety briefing and Vespa orientation before you set off to explore Rome\'s most iconic landmarks and hidden corners. Ride past the Colosseum, through charming cobblestone streets, around Piazza Navona, and up to panoramic viewpoints like the Aventine Hill keyhole. Your local guide leads the way on their own Vespa, stopping at scenic spots for photos and fascinating stories about Roman history and culture. The tour includes visits to local neighborhoods rarely seen by tourists, authentic gelato stops, and plenty of opportunities to soak in the Italian dolce vita lifestyle.',
    photos: [
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800',
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800',
      'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800',
      'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800'
    ],
    historicalInfo: 'Vespa scooters have been an iconic symbol of Italian culture since 1946.',
    yearBuilt: 'Modern activity',
    architect: 'Italian transportation heritage',
    translations: {
      en: {
        name: 'Vespa Tour of Rome',
        narration: 'Experience Rome like a local on a vintage Vespa scooter. Cruise through historic streets and discover hidden gems with an expert guide.',
        description: 'Guided Vespa tour through Rome\'s historic streets',
        historicalInfo: 'Vespa scooters have been an iconic symbol of Italian culture since 1946.',
        yearBuilt: 'Modern activity',
        architect: 'Italian transportation heritage'
      },
      it: {
        name: 'Tour di Roma in Vespa',
        narration: 'Vivi Roma come un locale su una Vespa d\'epoca. Percorri le strade storiche e scopri gemme nascoste con una guida esperta.',
        description: 'Tour guidato in Vespa attraverso le strade storiche di Roma',
        historicalInfo: 'Le Vespa sono un simbolo iconico della cultura italiana dal 1946.',
        yearBuilt: 'Attività moderna',
        architect: 'Patrimonio dei trasporti italiani'
      },
      ko: {
        name: '로마 베스파 투어',
        narration: '빈티지 베스파 스쿠터를 타고 현지인처럼 로마를 경험하세요. 역사적인 거리를 달리고 전문 가이드와 함께 숨겨진 보석을 발견하세요.',
        description: '로마 역사적 거리를 통한 가이드 베스파 투어',
        historicalInfo: '베스파 스쿠터는 1946년부터 이탈리아 문화의 상징적인 상징이었습니다.',
        yearBuilt: '현대 활동',
        architect: '이탈리아 교통 유산'
      },
      es: {
        name: 'Tour en Vespa por Roma',
        narration: 'Experimente Roma como un local en una Vespa vintage. Recorra las calles históricas y descubra joyas ocultas con un guía experto.',
        description: 'Tour guiado en Vespa por las calles históricas de Roma',
        detailedDescription: 'Sienta la emoción de conducir una clásica Vespa italiana por la Ciudad Eterna en este inolvidable tour. Su aventura comienza con una instrucción de seguridad y orientación sobre la Vespa antes de partir para explorar los monumentos más icónicos y rincones ocultos de Roma. Pase por el Coliseo, por encantadoras calles empedradas, alrededor de Piazza Navona y suba a miradores panorámicos como el ojo de cerradura del Aventino.'
      },
      fr: {
        name: 'Tour de Rome en Vespa',
        narration: 'Découvrez Rome comme un local sur une Vespa vintage. Parcourez les rues historiques et découvrez des trésors cachés avec un guide expert.',
        description: 'Visite guidée en Vespa à travers les rues historiques de Rome',
        detailedDescription: 'Ressentez le frisson de conduire une Vespa italienne classique à travers la Ville Éternelle lors de cette visite inoubliable. Votre aventure commence par un briefing de sécurité et une orientation Vespa avant de partir explorer les monuments les plus emblématiques et les coins cachés de Rome. Passez devant le Colisée, dans les charmantes rues pavées, autour de la Piazza Navona et montez vers des points de vue panoramiques comme le trou de la serrure de l\'Aventin.'
      },
      de: {
        name: 'Vespa-Tour durch Rom',
        narration: 'Erleben Sie Rom wie ein Einheimischer auf einer Vintage-Vespa. Fahren Sie durch historische Straßen und entdecken Sie versteckte Juwelen mit einem erfahrenen Führer.',
        description: 'Geführte Vespa-Tour durch Roms historische Straßen',
        detailedDescription: 'Spüren Sie den Nervenkitzel, eine klassische italienische Vespa durch die Ewige Stadt zu fahren bei dieser unvergesslichen Tour. Ihr Abenteuer beginnt mit einer Sicherheitseinweisung und Vespa-Orientierung, bevor Sie aufbrechen, um Roms ikonischste Sehenswürdigkeiten und versteckte Ecken zu erkunden. Fahren Sie am Kolosseum vorbei, durch charmante Kopfsteinpflasterstraßen, um die Piazza Navona und hinauf zu Panoramapunkten wie dem Schlüsselloch auf dem Aventin.'
      },
      zh: {
        name: '罗马韦士柏之旅',
        narration: '骑着复古韦士柏摩托车像当地人一样体验罗马。穿越历史街道，与专业导游一起发现隐藏的宝藏。',
        description: '穿越罗马历史街道的导览韦士柏之旅',
        detailedDescription: '在这次难忘的旅程中，感受骑着经典意大利韦士柏摩托车穿越永恒之城的刺激。您的冒险从安全简报和韦士柏入门开始，然后出发探索罗马最标志性的地标和隐藏角落。经过斗兽场，穿过迷人的鹅卵石街道，环绕纳沃纳广场，登上阿文丁山钥匙孔等全景观景点。'
      },
      ja: {
        name: 'ローマ・ベスパツアー',
        narration: 'ヴィンテージベスパに乗って地元の人のようにローマを体験してください。歴史的な通りを走り、専門ガイドと一緒に隠れた宝石を発見しましょう。',
        description: 'ローマの歴史的な通りを巡るガイド付きベスパツアー',
        detailedDescription: 'この忘れられないツアーで、クラシックなイタリアン・ベスパで永遠の都を走るスリルを味わってください。安全説明とベスパの使い方から始まり、ローマで最も象徴的なランドマークと隠れた場所を探索します。コロッセオを通り、魅力的な石畳の通りを抜け、ナヴォーナ広場を回り、アヴェンティーノの丘の鍵穴のようなパノラマスポットへ。'
      },
      pt: {
        name: 'Tour de Vespa por Roma',
        narration: 'Experimente Roma como um local em uma Vespa vintage. Percorra as ruas históricas e descubra joias escondidas com um guia especializado.',
        description: 'Tour guiado de Vespa pelas ruas históricas de Roma',
        detailedDescription: 'Sinta a emoção de pilotar uma clássica Vespa italiana pela Cidade Eterna neste tour inesquecível. Sua aventura começa com uma instrução de segurança e orientação sobre a Vespa antes de partir para explorar os monumentos mais icônicos e cantos escondidos de Roma. Passe pelo Coliseu, por charmosas ruas de paralelepípedos, ao redor da Piazza Navona e suba para mirantes panorâmicos como o buraco da fechadura do Aventino.'
      },
      ru: {
        name: 'Тур по Риму на Веспе',
        narration: 'Ощутите Рим как местный житель на винтажной Веспе. Прокатитесь по историческим улицам и откройте скрытые жемчужины с опытным гидом.',
        description: 'Экскурсия на Веспе по историческим улицам Рима',
        detailedDescription: 'Почувствуйте острые ощущения от езды на классической итальянской Веспе по Вечному городу в этом незабываемом туре. Ваше приключение начинается с инструктажа по безопасности и ознакомления с Веспой, прежде чем отправиться исследовать самые знаковые достопримечательности и скрытые уголки Рима. Проедьте мимо Колизея, по очаровательным мощеным улочкам, вокруг площади Навона и поднимитесь к панорамным точкам, таким как замочная скважина Авентина.'
      },
    }
  },
  {
    id: 'rome-cooking-class',
    cityId: 'rome',
    name: 'Roman Cuisine Cooking Class',
    lat: 41.8967,
    lng: 12.4822,
    radius: 60,
    narration: 'Learn to cook authentic Roman dishes from a local chef. Master traditional recipes like carbonara and cacio e pepe in a hands-on class.',
    description: 'Hands-on cooking class for traditional Roman cuisine',
    category: 'Activity',
    detailedDescription: 'Immerse yourself in Roman culinary tradition with this hands-on cooking class led by a local chef. Start with a visit to a traditional Roman market to select fresh ingredients while learning about Italian food culture. Then head to a professional kitchen or charming home setting to prepare a complete Roman meal. Learn the secrets of authentic carbonara (no cream!), perfect cacio e pepe, handmade fettuccine, and classic tiramisu. Your chef shares family recipes, cooking techniques, and the history behind each dish. The class includes wine pairings and culminates in a leisurely meal where you enjoy your creations together. Take home recipes and newfound skills to recreate Roman magic in your own kitchen.',
    photos: [
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800',
      'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800',
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800',
      'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800',
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
      'https://images.unsplash.com/photo-1476124369491-c2f4d4f2f895?w=800'
    ],
    historicalInfo: 'Traditional Roman recipes have been passed down through generations since ancient times.',
    yearBuilt: 'Ancient culinary tradition',
    architect: 'Roman culinary heritage',
    translations: {
      en: {
        name: 'Roman Cuisine Cooking Class',
        narration: 'Learn to cook authentic Roman dishes from a local chef. Master traditional recipes like carbonara and cacio e pepe in a hands-on class.',
        description: 'Hands-on cooking class for traditional Roman cuisine',
        historicalInfo: 'Traditional Roman recipes have been passed down through generations since ancient times.',
        yearBuilt: 'Ancient culinary tradition',
        architect: 'Roman culinary heritage'
      },
      it: {
        name: 'Corso di Cucina Romana',
        narration: 'Impara a cucinare piatti romani autentici da uno chef locale. Padroneggia ricette tradizionali come carbonara e cacio e pepe in una lezione pratica.',
        description: 'Corso di cucina pratico per la cucina tradizionale romana',
        historicalInfo: 'Le ricette romane tradizionali sono state tramandate di generazione in generazione fin dai tempi antichi.',
        yearBuilt: 'Tradizione culinaria antica',
        architect: 'Patrimonio culinario romano'
      },
      ko: {
        name: '로마 요리 클래스',
        narration: '현지 셰프로부터 정통 로마 요리를 배우세요. 카르보나라와 카치오 에 페페 같은 전통 레시피를 실습 수업에서 마스터하세요.',
        description: '전통 로마 요리를 위한 실습 요리 클래스',
        historicalInfo: '전통 로마 레시피는 고대부터 세대를 거쳐 전해져 내려왔습니다.',
        yearBuilt: '고대 요리 전통',
        architect: '로마 요리 유산'
      },
      es: {
        name: 'Clase de Cocina Romana',
        narration: 'Aprenda a cocinar platos romanos auténticos con un chef local. Domine recetas tradicionales como carbonara y cacio e pepe en una clase práctica.',
        description: 'Clase práctica de cocina tradicional romana',
        detailedDescription: 'Sumérjase en la tradición culinaria romana con esta clase práctica de cocina dirigida por un chef local. Comience con una visita a un mercado romano tradicional para seleccionar ingredientes frescos mientras aprende sobre la cultura gastronómica italiana. Luego diríjase a una cocina profesional o un encantador entorno hogareño para preparar una comida romana completa. Aprenda los secretos de la auténtica carbonara, el perfecto cacio e pepe, fettuccine caseros y tiramisú clásico.'
      },
      fr: {
        name: 'Cours de Cuisine Romaine',
        narration: 'Apprenez à cuisiner des plats romains authentiques avec un chef local. Maîtrisez des recettes traditionnelles comme la carbonara et le cacio e pepe lors d\'un cours pratique.',
        description: 'Cours de cuisine pratique de cuisine romaine traditionnelle',
        detailedDescription: 'Plongez dans la tradition culinaire romaine avec ce cours de cuisine pratique dirigé par un chef local. Commencez par une visite d\'un marché romain traditionnel pour sélectionner des ingrédients frais tout en découvrant la culture gastronomique italienne. Puis rendez-vous dans une cuisine professionnelle ou un charmant cadre domestique pour préparer un repas romain complet. Apprenez les secrets de l\'authentique carbonara, du parfait cacio e pepe, des fettuccine maison et du tiramisu classique.'
      },
      de: {
        name: 'Römischer Kochkurs',
        narration: 'Lernen Sie, authentische römische Gerichte von einem lokalen Koch zu kochen. Meistern Sie traditionelle Rezepte wie Carbonara und Cacio e Pepe in einem praktischen Kurs.',
        description: 'Praktischer Kochkurs für traditionelle römische Küche',
        detailedDescription: 'Tauchen Sie ein in die römische Kochtradition mit diesem praktischen Kochkurs unter der Leitung eines lokalen Kochs. Beginnen Sie mit einem Besuch auf einem traditionellen römischen Markt, um frische Zutaten auszuwählen und dabei die italienische Esskultur kennenzulernen. Dann geht es in eine professionelle Küche oder ein charmantes häusliches Ambiente, um ein komplettes römisches Mahl zuzubereiten. Lernen Sie die Geheimnisse der authentischen Carbonara, des perfekten Cacio e Pepe, hausgemachter Fettuccine und klassischem Tiramisu.'
      },
      zh: {
        name: '罗马烹饪课程',
        narration: '向当地厨师学习烹饪正宗罗马菜肴。在实践课程中掌握培根蛋面和奶酪胡椒面等传统食谱。',
        description: '传统罗马美食实践烹饪课程',
        detailedDescription: '通过这个由当地厨师带领的实践烹饪课程，沉浸在罗马烹饪传统中。从参观传统罗马市场开始，选择新鲜食材，同时了解意大利饮食文化。然后前往专业厨房或温馨的家庭环境准备一顿完整的罗马餐。学习正宗培根蛋面、完美奶酪胡椒面、手工意面和经典提拉米苏的秘诀。'
      },
      ja: {
        name: 'ローマ料理教室',
        narration: '地元のシェフから本格的なローマ料理を学びましょう。カルボナーラやカチョエペペなどの伝統的なレシピを実践クラスでマスターします。',
        description: '伝統的なローマ料理の実践料理教室',
        detailedDescription: '地元シェフが指導するこの実践的な料理教室で、ローマの料理伝統に浸ってください。まず伝統的なローマの市場を訪れ、新鲜な食材を選びながらイタリアの食文化を学びます。その後、プロのキッチンや家庭的な雰囲気の中で完全なローマの食事を準備します。本格的なカルボナーラ、完璧なカチョエペペ、手打ちフェットチーネ、クラシックなティラミスの秘密を学びましょう。'
      },
      pt: {
        name: 'Aula de Culinária Romana',
        narration: 'Aprenda a cozinhar pratos romanos autênticos com um chef local. Domine receitas tradicionais como carbonara e cacio e pepe em uma aula prática.',
        description: 'Aula prática de culinária romana tradicional',
        detailedDescription: 'Mergulhe na tradição culinária romana com esta aula de culinária prática liderada por um chef local. Comece com uma visita a um mercado romano tradicional para selecionar ingredientes frescos enquanto aprende sobre a cultura gastronômica italiana. Depois vá para uma cozinha profissional ou um charmoso ambiente doméstico para preparar uma refeição romana completa. Aprenda os segredos da autêntica carbonara, do perfeito cacio e pepe, fettuccine feito à mão e tiramisù clássico.'
      },
      ru: {
        name: 'Кулинарный Класс Римской Кухни',
        narration: 'Научитесь готовить аутентичные римские блюда у местного шеф-повара. Освойте традиционные рецепты, такие как карбонара и качо э пепе, на практическом занятии.',
        description: 'Практический кулинарный класс традиционной римской кухни',
        detailedDescription: 'Погрузитесь в римские кулинарные традиции на этом практическом кулинарном занятии под руководством местного шеф-повара. Начните с посещения традиционного римского рынка, чтобы выбрать свежие ингредиенты, узнавая об итальянской гастрономической культуре. Затем отправляйтесь на профессиональную кухню или в уютную домашнюю обстановку, чтобы приготовить полноценный римский обед. Узнайте секреты аутентичной карбонары, идеального качо э пепе, домашних феттучине и классического тирамису.'
      },
    }
  },
  // Rome Gift Shops
  {
    id: 'borghese-gift-shop-rome',
    cityId: 'rome',
    name: 'Borghese Souvenir Gallery',
    lat: 41.9009,
    lng: 12.4833,
    radius: 30,
    narration: 'Premium gift shop near Spanish Steps featuring Italian leather goods, Vatican souvenirs, and handcrafted jewelry. Credit cards accepted, tax-free shopping available.',
    description: 'Upscale gift shop specializing in Italian leather, Vatican memorabilia, and artisan jewelry',
    category: 'Gift Shop',
    openingHours: 'Mon-Sun: 9:00-20:00',
    priceRange: '€€-€€€ (€15-150)',
    detailedDescription: 'Located steps from the Spanish Steps, Borghese Souvenir Gallery offers premium Italian souvenirs and gifts. Specialties include genuine Italian leather bags and wallets, official Vatican City merchandise, handcrafted Murano glass jewelry, religious artifacts and rosaries, Roman-themed home décor, and authentic Italian food products. Payment accepted: Visa, Mastercard, Amex, UnionPay, Alipay, WeChat Pay, and cash (EUR/USD). Tax-free shopping available for non-EU tourists. Current promotion: 15% off on leather goods (valid until Dec 2025). Summer sale: 20-30% off selected items (June-August).',
    photos: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'],
    translations: {
      en: { name: 'Borghese Souvenir Gallery', narration: 'Premium gift shop near Spanish Steps featuring Italian leather goods, Vatican souvenirs, and handcrafted jewelry. Credit cards accepted, tax-free shopping available.', description: 'Upscale gift shop specializing in Italian leather, Vatican memorabilia, and artisan jewelry' },
      ko: { name: '보르게세 기념품 갤러리', narration: '스페인 계단 근처의 프리미엄 선물 가게로 이탈리아 가죽 제품, 바티칸 기념품, 수제 보석을 판매합니다. 신용카드 가능, 면세 쇼핑 가능.', description: '이탈리아 가죽, 바티칸 기념품, 장인 보석 전문 고급 선물 가게' },
      it: { name: 'Galleria Souvenir Borghese', narration: 'Negozio di souvenir premium vicino a Piazza di Spagna con articoli in pelle italiana, souvenir vaticani e gioielli artigianali. Carte di credito accettate, shopping tax-free disponibile.', description: 'Negozio di souvenir di lusso specializzato in pelletteria italiana, memorabilia vaticana e gioielli artigianali' },
      es: { name: 'Galería de Souvenirs Borghese', narration: 'Tienda de regalos premium cerca de la Escalinata Española con artículos de cuero italiano, souvenirs del Vaticano y joyería artesanal. Tarjetas de crédito aceptadas, compras libres de impuestos disponibles.', description: 'Tienda de regalos de lujo especializada en cuero italiano, recuerdos vaticanos y joyería artesanal' },
      fr: { name: 'Galerie de Souvenirs Borghese', narration: 'Boutique de cadeaux haut de gamme près des Escaliers Espagnols proposant des articles en cuir italien, des souvenirs du Vatican et des bijoux artisanaux. Cartes de crédit acceptées, shopping hors taxes disponible.', description: 'Boutique de cadeaux haut de gamme spécialisée dans le cuir italien, les souvenirs du Vatican et les bijoux artisanaux' },
      de: { name: 'Borghese Souvenir Galerie', narration: 'Premium-Geschenkeladen in der Nähe der Spanischen Treppe mit italienischen Lederwaren, Vatikan-Souvenirs und handgefertigtem Schmuck. Kreditkarten akzeptiert, steuerfreies Einkaufen verfügbar.', description: 'Gehobener Souvenirladen spezialisiert auf italienisches Leder, Vatikan-Memorabilia und handwerklichen Schmuck' },
      zh: { name: '博尔盖塞纪念品画廊', narration: '西班牙台阶附近的高级礼品店，提供意大利皮具、梵蒂冈纪念品和手工珠宝。接受信用卡，提供免税购物。', description: '专营意大利皮具、梵蒂冈纪念品和工艺珠宝的高档礼品店' },
      ja: { name: 'ボルゲーゼ土産ギャラリー', narration: 'スペイン広場近くのプレミアムギフトショップで、イタリアンレザー製品、バチカンお土産、手作りジュエリーを取り扱っています。クレジットカード利用可、免税ショッピング可能。', description: 'イタリアンレザー、バチカン記念品、職人ジュエリー専門の高級ギフトショップ' },
      pt: { name: 'Galeria de Souvenirs Borghese', narration: 'Loja de presentes premium perto da Escadaria Espanhola com artigos de couro italiano, souvenirs do Vaticano e joias artesanais. Cartões de crédito aceitos, compras isentas de impostos disponíveis.', description: 'Loja de presentes sofisticada especializada em couro italiano, souvenirs do Vaticano e joias artesanais' },
      ru: { name: 'Галерея сувениров Боргезе', narration: 'Премиум магазин подарков рядом с Испанской лестницей с итальянскими кожаными изделиями, ватиканскими сувенирами и ювелирными украшениями ручной работы. Принимаются кредитные карты, доступен шоппинг без НДС.', description: 'Элитный магазин сувениров, специализирующийся на итальянской коже, ватиканских сувенирах и ювелирных украшениях ручной работы' }
    }
  },
  {
    id: 'vatican-gifts-rome',
    cityId: 'rome',
    name: 'Vatican Treasures Shop',
    lat: 41.9022,
    lng: 12.4539,
    radius: 30,
    narration: 'Official Vatican gift shop offering blessed rosaries, papal memorabilia, and religious art. All cards accepted including Alipay and WeChat Pay. Open daily 8:30-19:00.',
    description: 'Authentic Vatican souvenirs, religious items, and papal merchandise',
    category: 'Gift Shop',
    openingHours: 'Mon-Sun: 8:30-19:00',
    priceRange: '€-€€€ (€5-200)',
    detailedDescription: 'Vatican Treasures Shop, located 100m from St. Peter\'s Basilica, offers authentic Vatican City merchandise. Featured items: blessed rosaries and crucifixes, papal blessing certificates, Vatican stamps and coins, religious books in 25 languages, Vatican Museums replicas, sacred art prints, and ecclesiastical vestments. Payment methods: all major credit cards, Alipay, WeChat Pay, Apple Pay, Google Pay, cash. Special services: gift wrapping, worldwide shipping, tax refund assistance. Black Friday promotion: 25% off all items (Nov 2025). Easter sale: Buy 2 get 1 free on rosaries (March-April).',
    photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'],
    translations: {
      en: { name: 'Vatican Treasures Shop', narration: 'Official Vatican gift shop offering blessed rosaries, papal memorabilia, and religious art. All cards accepted including Alipay and WeChat Pay. Open daily 8:30-19:00.', description: 'Authentic Vatican souvenirs, religious items, and papal merchandise' },
      ko: { name: '바티칸 트레저스 샵', narration: '축복받은 묵주, 교황 기념품, 종교 예술품을 판매하는 공식 바티칸 기념품 가게입니다. 알리페이와 위챗페이 포함 모든 카드 가능. 매일 8:30-19:00 영업.', description: '정통 바티칸 기념품, 종교 용품, 교황 상품' },
      it: { name: 'Negozio Tesori Vaticani', narration: 'Negozio ufficiale del Vaticano che offre rosari benedetti, memorabilia papale e arte religiosa. Tutte le carte accettate inclusi Alipay e WeChat Pay. Aperto tutti i giorni 8:30-19:00.', description: 'Souvenir autentici del Vaticano, articoli religiosi e merchandising papale' },
      es: { name: 'Tienda Tesoros del Vaticano', narration: 'Tienda oficial del Vaticano que ofrece rosarios benditos, recuerdos papales y arte religioso. Todas las tarjetas aceptadas incluyendo Alipay y WeChat Pay. Abierto diariamente 8:30-19:00.', description: 'Souvenirs auténticos del Vaticano, artículos religiosos y merchandising papal' },
      fr: { name: 'Boutique Trésors du Vatican', narration: 'Boutique officielle du Vatican proposant des chapelets bénis, des souvenirs papaux et de l\'art religieux. Toutes les cartes acceptées y compris Alipay et WeChat Pay. Ouvert tous les jours 8:30-19:00.', description: 'Souvenirs authentiques du Vatican, articles religieux et merchandising papal' },
      de: { name: 'Vatikan Schätze Shop', narration: 'Offizieller Vatikan-Geschenkeladen mit gesegneten Rosenkränzen, päpstlichen Andenken und religiöser Kunst. Alle Karten akzeptiert einschließlich Alipay und WeChat Pay. Täglich geöffnet 8:30-19:00.', description: 'Authentische Vatikan-Souvenirs, religiöse Artikel und päpstliche Merchandise' },
      zh: { name: '梵蒂冈珍宝店', narration: '官方梵蒂冈礼品店，提供祝福念珠、教皇纪念品和宗教艺术品。接受所有卡片包括支付宝和微信支付。每天8:30-19:00营业。', description: '正宗梵蒂冈纪念品、宗教用品和教皇商品' },
      ja: { name: 'バチカン・トレジャーズ・ショップ', narration: '祝福されたロザリオ、教皇記念品、宗教芸術品を提供する公式バチカンギフトショップ。AlipayとWeChat Payを含むすべてのカード利用可。毎日8:30-19:00営業。', description: '本物のバチカンお土産、宗教用品、教皇グッズ' },
      pt: { name: 'Loja Tesouros do Vaticano', narration: 'Loja oficial do Vaticano oferecendo rosários abençoados, souvenirs papais e arte religiosa. Todos os cartões aceitos incluindo Alipay e WeChat Pay. Aberto diariamente 8:30-19:00.', description: 'Souvenirs autênticos do Vaticano, itens religiosos e merchandising papal' },
      ru: { name: 'Магазин сокровищ Ватикана', narration: 'Официальный магазин подарков Ватикана с благословенными четками, папскими сувенирами и религиозным искусством. Принимаются все карты включая Alipay и WeChat Pay. Открыто ежедневно 8:30-19:00.', description: 'Аутентичные ватиканские сувениры, религиозные предметы и папская продукция' }
    }
  },
  {
    id: 'colosseum-memories-rome',
    cityId: 'rome',
    name: 'Colosseum Memories',
    lat: 41.8902,
    lng: 12.4924,
    radius: 30,
    narration: 'Iconic Roman souvenirs next to the Colosseum. Gladiator helmets, Roman coins replicas, and Italian ceramics. Visa, Mastercard, Amex accepted. Special winter discounts available.',
    description: 'Colosseum-themed souvenirs, Roman replicas, and Italian ceramics',
    category: 'Gift Shop',
    openingHours: 'Mon-Sun: 8:00-21:00',
    priceRange: '€-€€ (€3-80)',
    detailedDescription: 'Colosseum Memories is the closest souvenir shop to the ancient amphitheater. Popular items: gladiator helmets and armor replicas, ancient Roman coin reproductions, Colosseum miniatures (various sizes), Italian hand-painted ceramics, "SPQR" t-shirts and caps, Roman Empire history books, and fridge magnets. Payment: Visa, Mastercard, Amex, Discover, JCB, cash (multiple currencies). Tourist benefits: multilingual staff (EN/IT/ES/FR/ZH/JA/KO), free gift wrapping, package storage while touring. Winter promotion: 20% off ceramic items (Nov-Feb). Group discount: 10% off for groups of 6+ people.',
    photos: ['https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=800'],
    translations: {
      en: { name: 'Colosseum Memories', narration: 'Iconic Roman souvenirs next to the Colosseum. Gladiator helmets, Roman coins replicas, and Italian ceramics. Visa, Mastercard, Amex accepted. Special winter discounts available.', description: 'Colosseum-themed souvenirs, Roman replicas, and Italian ceramics' },
      ko: { name: '콜로세움 메모리즈', narration: '콜로세움 옆 상징적인 로마 기념품점. 검투사 투구, 로마 동전 복제품, 이탈리아 도자기. Visa, Mastercard, Amex 사용 가능. 겨울 특별 할인 제공.', description: '콜로세움 테마 기념품, 로마 복제품, 이탈리아 도자기' },
      it: { name: 'Memorie del Colosseo', narration: 'Souvenir romani iconici accanto al Colosseo. Elmi da gladiatore, repliche di monete romane e ceramiche italiane. Visa, Mastercard, Amex accettate. Sconti invernali speciali disponibili.', description: 'Souvenir a tema Colosseo, repliche romane e ceramiche italiane' },
      es: { name: 'Recuerdos del Coliseo', narration: 'Souvenirs romanos icónicos junto al Coliseo. Cascos de gladiador, réplicas de monedas romanas y cerámicas italianas. Visa, Mastercard, Amex aceptadas. Descuentos especiales de invierno disponibles.', description: 'Souvenirs temáticos del Coliseo, réplicas romanas y cerámicas italianas' },
      fr: { name: 'Souvenirs du Colisée', narration: 'Souvenirs romains emblématiques à côté du Colisée. Casques de gladiateur, répliques de pièces romaines et céramiques italiennes. Visa, Mastercard, Amex acceptées. Réductions hivernales spéciales disponibles.', description: 'Souvenirs sur le thème du Colisée, répliques romaines et céramiques italiennes' },
      de: { name: 'Kolosseum Erinnerungen', narration: 'Ikonische römische Souvenirs neben dem Kolosseum. Gladiatorenhelme, römische Münzrepliken und italienische Keramik. Visa, Mastercard, Amex akzeptiert. Spezielle Winterrabatte verfügbar.', description: 'Kolosseum-Souvenirs, römische Repliken und italienische Keramik' },
      zh: { name: '斗兽场回忆', narration: '斗兽场旁的标志性罗马纪念品。角斗士头盔、罗马硬币复制品和意大利陶瓷。接受Visa、Mastercard、Amex。提供特别冬季折扣。', description: '斗兽场主题纪念品、罗马复制品和意大利陶瓷' },
      ja: { name: 'コロッセオメモリーズ', narration: 'コロッセオ隣の象徴的なローマ土産店。剣闘士ヘルメット、ローマコインレプリカ、イタリア陶器。Visa、Mastercard、Amex利用可。特別冬季割引あり。', description: 'コロッセオテーマのお土産、ローマレプリカ、イタリア陶器' },
      pt: { name: 'Memórias do Coliseu', narration: 'Souvenirs romanos icônicos ao lado do Coliseu. Capacetes de gladiador, réplicas de moedas romanas e cerâmicas italianas. Visa, Mastercard, Amex aceitos. Descontos especiais de inverno disponíveis.', description: 'Souvenirs temáticos do Coliseu, réplicas romanas e cerâmicas italianas' },
      ru: { name: 'Воспоминания о Колизее', narration: 'Культовые римские сувениры рядом с Колизеем. Шлемы гладиаторов, копии римских монет и итальянская керамика. Принимаются Visa, Mastercard, Amex. Доступны специальные зимние скидки.', description: 'Сувениры на тему Колизея, римские копии и итальянская керамика' }
    }
  },
  {
    id: 'trastevere-artisan-shop-rome',
    cityId: 'rome',
    name: 'Trastevere Artisan Boutique',
    lat: 41.8897,
    lng: 12.4689,
    radius: 30,
    narration: 'Charming artisan shop in historic Trastevere. Handmade leather journals, local wine, Italian olive oil, and craft pottery. Cash and cards welcome. Summer artisan fair discounts.',
    description: 'Handcrafted Italian products, local wines, and artisan pottery',
    category: 'Gift Shop',
    openingHours: 'Tue-Sun: 10:00-20:00, Mon: Closed',
    priceRange: '€€-€€€ (€20-120)',
    detailedDescription: 'Nestled in the heart of Trastevere, this boutique showcases authentic Roman craftsmanship. Products: handmade leather journals and photo albums, local Lazio wines and olive oils, artisan ceramics and pottery, hand-painted silk scarves, traditional Roman recipe books, natural soap and cosmetics, vintage Italian posters. Payment methods: cash (EUR preferred), all major credit cards, contactless payments. Artisan meet-and-greets every Saturday 15:00-17:00. Summer Artisan Fair (July): 30% off pottery items. Christmas Market Special (Dec): complimentary gift wrapping and wine tasting.',
    photos: ['https://images.unsplash.com/photo-1555421689-d68471e189f2?w=800'],
    translations: {
      en: { name: 'Trastevere Artisan Boutique', narration: 'Charming artisan shop in historic Trastevere. Handmade leather journals, local wine, Italian olive oil, and craft pottery. Cash and cards welcome. Summer artisan fair discounts.', description: 'Handcrafted Italian products, local wines, and artisan pottery' },
      ko: { name: '트라스테베레 장인 부티크', narration: '역사적인 트라스테베레의 매력적인 장인 가게. 수제 가죽 저널, 현지 와인, 이탈리아 올리브 오일, 공예 도자기. 현금과 카드 환영. 여름 장인 박람회 할인.', description: '수제 이탈리아 제품, 현지 와인, 장인 도자기' },
      it: { name: 'Bottega Artigiana di Trastevere', narration: 'Affascinante negozio artigianale nel centro storico di Trastevere. Diari in pelle fatti a mano, vino locale, olio d\'oliva italiano e ceramiche artigianali. Contanti e carte benvenuti. Sconti fiera artigianale estiva.', description: 'Prodotti italiani artigianali, vini locali e ceramiche artigianali' },
      es: { name: 'Boutique Artesanal Trastevere', narration: 'Encantadora tienda artesanal en el histórico Trastevere. Diarios de cuero hechos a mano, vino local, aceite de oliva italiano y cerámica artesanal. Efectivo y tarjetas bienvenidos. Descuentos de feria artesanal de verano.', description: 'Productos italianos artesanales, vinos locales y cerámica artesanal' },
      fr: { name: 'Boutique Artisanale Trastevere', narration: 'Charmante boutique artisanale dans le quartier historique de Trastevere. Carnets en cuir faits main, vin local, huile d\'olive italienne et poterie artisanale. Espèces et cartes acceptées. Réductions foire artisanale d\'été.', description: 'Produits italiens artisanaux, vins locaux et poterie artisanale' },
      de: { name: 'Trastevere Handwerks-Boutique', narration: 'Charmanter Handwerksladen im historischen Trastevere. Handgefertigte Ledertagebücher, lokaler Wein, italienisches Olivenöl und handwerkliche Keramik. Bargeld und Karten willkommen. Sommer-Handwerksmesse-Rabatte.', description: 'Handgefertigte italienische Produkte, lokale Weine und Handwerkskeramik' },
      zh: { name: '特拉斯提弗列工匠精品店', narration: '历史悠久的特拉斯提弗列迷人工匠店。手工皮革日记本、当地葡萄酒、意大利橄榄油和工艺陶器。欢迎现金和卡片。夏季工匠集市折扣。', description: '手工意大利产品、当地葡萄酒和工匠陶器' },
      ja: { name: 'トラステヴェレ職人ブティック', narration: '歴史的なトラステヴェレの魅力的な職人店。手作りレザージャーナル、地元ワイン、イタリアンオリーブオイル、工芸陶器。現金とカード歓迎。夏の職人フェア割引。', description: '手作りイタリア製品、地元ワイン、職人陶器' },
      pt: { name: 'Boutique Artesanal Trastevere', narration: 'Charmosa loja artesanal no histórico Trastevere. Diários de couro feitos à mão, vinho local, azeite italiano e cerâmica artesanal. Dinheiro e cartões bem-vindos. Descontos de feira artesanal de verão.', description: 'Produtos italianos artesanais, vinhos locais e cerâmica artesanal' },
      ru: { name: 'Трастевере ремесленный бутик', narration: 'Очаровательный ремесленный магазин в историческом Трастевере. Ручные кожаные дневники, местное вино, итальянское оливковое масло и гончарные изделия. Наличные и карты приветствуются. Скидки летней ремесленной ярмарки.', description: 'Изделия ручной работы, местные вина и ремесленная керамика' }
    }
  },
  {
    id: 'piazza-navona-crafts-rome',
    cityId: 'rome',
    name: 'Piazza Navona Craft Gallery',
    lat: 41.8992,
    lng: 12.4731,
    radius: 30,
    narration: 'Premium craft gallery at Piazza Navona featuring Italian marble sculptures, Murano glass, and renaissance art prints. All payment methods accepted. Year-round cultural promotions.',
    description: 'Italian marble art, Murano glass masterpieces, and Renaissance reproductions',
    category: 'Gift Shop',
    openingHours: 'Mon-Sun: 9:30-21:00',
    priceRange: '€€€-€€€€ (€50-500)',
    detailedDescription: 'Piazza Navona Craft Gallery is Rome\'s premier destination for luxury Italian crafts. Exclusive collections: Carrara marble sculptures and busts, authentic Murano glass vases and chandeliers, Renaissance and Baroque art reproductions, handwoven tapestries, Italian gold and silver jewelry, antique map reproductions, limited edition prints by Italian artists. Payment: all credit cards, digital wallets (Apple Pay, Google Pay, Samsung Pay), bank transfers for large purchases, cash. VIP services: personal shopper, worldwide insured shipping, certificate of authenticity. Spring Collection Launch (April): 15% off new arrivals. Art Appreciation Month (October): free art history tours with purchase over €200.',
    photos: ['https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'],
    translations: {
      en: { name: 'Piazza Navona Craft Gallery', narration: 'Premium craft gallery at Piazza Navona featuring Italian marble sculptures, Murano glass, and renaissance art prints. All payment methods accepted. Year-round cultural promotions.', description: 'Italian marble art, Murano glass masterpieces, and Renaissance reproductions' },
      ko: { name: '피아차 나보나 공예 갤러리', narration: '피아차 나보나의 프리미엄 공예 갤러리로 이탈리아 대리석 조각품, 무라노 유리, 르네상스 미술 인쇄물을 선보입니다. 모든 결제 수단 가능. 연중 문화 프로모션.', description: '이탈리아 대리석 예술, 무라노 유리 걸작, 르네상스 복제품' },
      it: { name: 'Galleria Artigianale Piazza Navona', narration: 'Galleria artigianale premium a Piazza Navona con sculture in marmo italiano, vetro di Murano e stampe d\'arte rinascimentale. Tutti i metodi di pagamento accettati. Promozioni culturali tutto l\'anno.', description: 'Arte in marmo italiano, capolavori in vetro di Murano e riproduzioni rinascimentali' },
      es: { name: 'Galería de Artesanía Piazza Navona', narration: 'Galería de artesanía premium en Piazza Navona con esculturas de mármol italiano, cristal de Murano e impresiones de arte renacentista. Todos los métodos de pago aceptados. Promociones culturales todo el año.', description: 'Arte en mármol italiano, obras maestras en cristal de Murano y reproducciones renacentistas' },
      fr: { name: 'Galerie d\'Artisanat Piazza Navona', narration: 'Galerie d\'artisanat premium à Piazza Navona présentant des sculptures en marbre italien, du verre de Murano et des reproductions d\'art de la Renaissance. Tous les moyens de paiement acceptés. Promotions culturelles toute l\'année.', description: 'Art en marbre italien, chefs-d\'œuvre en verre de Murano et reproductions de la Renaissance' },
      de: { name: 'Piazza Navona Kunstgalerie', narration: 'Premium-Kunstgalerie an der Piazza Navona mit italienischen Marmorskulpturen, Murano-Glas und Renaissance-Kunstdrucken. Alle Zahlungsmethoden akzeptiert. Ganzjährige kulturelle Aktionen.', description: 'Italienische Marmorkunst, Murano-Glasmeisterwerke und Renaissance-Reproduktionen' },
      zh: { name: '纳沃纳广场工艺画廊', narration: '纳沃纳广场的高级工艺画廊，展示意大利大理石雕塑、穆拉诺玻璃和文艺复兴艺术印刷品。接受所有付款方式。全年文化促销。', description: '意大利大理石艺术、穆拉诺玻璃杰作和文艺复兴复制品' },
      ja: { name: 'ピアッツァ・ナヴォーナ工芸ギャラリー', narration: 'ピアッツァ・ナヴォーナのプレミアム工芸ギャラリーで、イタリア大理石彫刻、ムラーノガラス、ルネサンス美術版画を展示。すべての支払い方法利用可。年間を通じた文化プロモーション。', description: 'イタリア大理石芸術、ムラーノガラス傑作、ルネサンス複製品' },
      pt: { name: 'Galeria de Artesanato Piazza Navona', narration: 'Galeria de artesanato premium na Piazza Navona com esculturas de mármore italiano, vidro de Murano e gravuras de arte renascentista. Todos os métodos de pagamento aceitos. Promoções culturais durante todo o ano.', description: 'Arte em mármore italiano, obras-primas em vidro de Murano e reproduções renascentistas' },
      ru: { name: 'Галерея ремесел площади Навона', narration: 'Премиум-галерея ремесел на площади Навона с итальянскими мраморными скульптурами, муранским стеклом и репродукциями искусства эпохи Возрождения. Принимаются все способы оплаты. Круглогодичные культурные акции.', description: 'Итальянское мраморное искусство, шедевры муранского стекла и репродукции эпохи Возрождения' }
    }
  },
  // Additional Paris Activities
  {
    id: 'moulin-rouge-show',
    cityId: 'paris',
    name: 'Moulin Rouge Cabaret Show',
    lat: 48.8841,
    lng: 2.3324,
    radius: 50,
    narration: 'Experience the legendary Moulin Rouge cabaret show in the heart of Montmartre. Enjoy world-class performers, dazzling costumes, and the famous can-can dance.',
    description: 'Iconic Parisian cabaret show with dinner option',
    category: 'Activity',
    detailedDescription: 'The Moulin Rouge is the world\'s most famous cabaret, offering a spectacular evening of entertainment since 1889. The current show "Féerie" features 100 performers including 60 Doriss Girls recruited worldwide, elaborate sets, 1,000 costumes covered in feathers, rhinestones and sequins created in the Moulin Rouge workshops, stunning choreography, and the legendary French Cancan finale. Choose from show-only tickets or upgrade to include a gourmet dinner prepared by chef David Le Quellec. The venue\'s Belle Époque décor, with its red velvet, mirrors, and glittering chandeliers, creates an unforgettable atmosphere. Arrive early to soak in the ambiance and enjoy champagne before the show begins.',
    photos: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
      'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
      'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800'
    ],
    historicalInfo: 'The Moulin Rouge opened in 1889 and quickly became the birthplace of the modern can-can dance.',
    yearBuilt: '1889',
    architect: 'Joseph Oller and Charles Zidler',
    translations: {
      en: {
        name: 'Moulin Rouge Cabaret Show',
        narration: 'Experience the legendary Moulin Rouge cabaret show in the heart of Montmartre. Enjoy world-class performers, dazzling costumes, and the famous can-can dance.',
        description: 'Iconic Parisian cabaret show with dinner option',
        historicalInfo: 'The Moulin Rouge opened in 1889 and quickly became the birthplace of the modern can-can dance.',
        yearBuilt: '1889',
        architect: 'Joseph Oller and Charles Zidler'
      },
      it: {
        name: 'Spettacolo Cabaret Moulin Rouge',
        narration: 'Vivi il leggendario spettacolo di cabaret del Moulin Rouge nel cuore di Montmartre. Goditi artisti di classe mondiale, costumi abbaglianti e la famosa danza can-can.',
        description: 'Iconico spettacolo di cabaret parigino con opzione cena',
        historicalInfo: 'Il Moulin Rouge ha aperto nel 1889 ed è rapidamente diventato la culla della moderna danza can-can.',
        yearBuilt: '1889',
        architect: 'Joseph Oller e Charles Zidler'
      },
      ko: {
        name: '물랭루즈 카바레 쇼',
        narration: '몽마르트 중심부에서 전설적인 물랭루즈 카바레 쇼를 경험하세요. 세계적인 공연자, 눈부신 의상, 유명한 캉캉 댄스를 즐기세요.',
        description: '저녁 식사 옵션이 있는 상징적인 파리 카바레 쇼',
        historicalInfo: '물랭루즈는 1889년에 열렸고 빠르게 현대 캉캉 댄스의 발상지가 되었습니다.',
        yearBuilt: '1889년',
        architect: '조셉 올러와 샤를 지들러'
      }
    }
  },
  {
    id: 'louvre-skip-line-tour',
    cityId: 'paris',
    name: 'Louvre Skip-the-Line Guided Tour',
    lat: 48.8606,
    lng: 2.3376,
    radius: 70,
    narration: 'Bypass the long queues and explore the Louvre\'s masterpieces with an expert guide. See the Mona Lisa, Venus de Milo, and other iconic artworks.',
    description: 'Skip-the-line guided tour of Louvre Museum highlights',
    category: 'Activity',
    detailedDescription: 'Skip the notoriously long Louvre lines with priority access and make the most of your visit with an expert art historian guide. This comprehensive tour covers the museum\'s greatest masterpieces including Leonardo da Vinci\'s Mona Lisa, the ancient Greek Venus de Milo, the Winged Victory of Samothrace, and works by Michelangelo, Raphael, and Delacroix. Your guide provides fascinating context about each artwork, the artists who created them, and the historical periods they represent. Learn insider secrets about the artworks and navigate the massive museum efficiently. The tour typically lasts 2-3 hours, covering the essential highlights while allowing time for questions and photo opportunities. Small group sizes ensure an intimate experience.',
    photos: [
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
      'https://images.unsplash.com/photo-1511882150382-421056c89033?w=800',
      'https://images.unsplash.com/photo-1566740933430-b5e70b06d2d5?w=800',
      'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=800',
      'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800',
      'https://images.unsplash.com/photo-1550432163-9cb326104944?w=800',
      'https://images.unsplash.com/photo-1585159812596-fcd94c2be419?w=800'
    ],
    historicalInfo: 'The Louvre holds over 380,000 objects and displays 35,000 works of art in eight curatorial departments.',
    yearBuilt: 'Museum opened 1793',
    architect: 'Originally royal palace, various architects',
    translations: {
      en: {
        name: 'Louvre Skip-the-Line Guided Tour',
        narration: 'Bypass the long queues and explore the Louvre\'s masterpieces with an expert guide. See the Mona Lisa, Venus de Milo, and other iconic artworks.',
        description: 'Skip-the-line guided tour of Louvre Museum highlights',
        historicalInfo: 'The Louvre holds over 380,000 objects and displays 35,000 works of art.',
        yearBuilt: 'Museum opened 1793',
        architect: 'Originally royal palace, various architects'
      },
      it: {
        name: 'Tour Guidato Louvre Salta la Coda',
        narration: 'Salta le lunghe code ed esplora i capolavori del Louvre con una guida esperta. Vedi la Gioconda, la Venere di Milo e altre opere iconiche.',
        description: 'Tour guidato salta la coda dei punti salienti del Museo del Louvre',
        historicalInfo: 'Il Louvre ospita oltre 380.000 oggetti ed espone 35.000 opere d\'arte.',
        yearBuilt: 'Museo aperto nel 1793',
        architect: 'Originariamente palazzo reale, vari architetti'
      },
      ko: {
        name: '루브르 우선 입장 가이드 투어',
        narration: '긴 줄을 건너뛰고 전문 가이드와 함께 루브르의 걸작을 탐험하세요. 모나리자, 밀로의 비너스 및 기타 상징적인 예술 작품을 보세요.',
        description: '루브르 박물관 하이라이트 우선 입장 가이드 투어',
        historicalInfo: '루브르는 380,000개 이상의 물건을 보유하고 있으며 35,000개의 예술 작품을 전시합니다.',
        yearBuilt: '박물관 개관 1793년',
        architect: '원래 왕궁, 다양한 건축가'
      }
    }
  },
  {
    id: 'paris-catacombs-tour',
    cityId: 'paris',
    name: 'Paris Catacombs Tour',
    lat: 48.8338,
    lng: 2.3324,
    radius: 50,
    narration: 'Descend into Paris\'s mysterious underground ossuary. Explore tunnels lined with millions of bones and learn about this haunting piece of Parisian history.',
    description: 'Guided tour of the underground Paris Catacombs',
    category: 'Activity',
    detailedDescription: 'Venture 20 meters below the streets of Paris into the world\'s largest underground ossuary. The Catacombs hold the remains of over 6 million Parisians, transferred here from overflowing city cemeteries in the late 18th and early 19th centuries. Your guide leads you through the eerie tunnels lined with carefully arranged bones and skulls, explaining the history of this unique site. Learn about the former limestone quarries that became the solution to Paris\'s cemetery crisis, the painstaking process of transferring the remains, and the symbolic arrangements of bones that create macabre works of art. The tour includes skip-the-line access to avoid the notoriously long queues. Temperature is 14°C year-round, so bring a jacket. Not recommended for those with claustrophobia or mobility issues due to 130 steps down and narrow passages.',
    photos: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=800',
      'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800',
      'https://images.unsplash.com/photo-1519225420449-5e0297e79c19?w=800',
      'https://images.unsplash.com/photo-1590578936270-e1d68582affe?w=800',
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800'
    ],
    historicalInfo: 'The Catacombs were created in the late 1700s when overflowing cemeteries became a public health hazard.',
    yearBuilt: '1786-1788',
    architect: 'Charles-Axel Guillaumot',
    translations: {
      en: {
        name: 'Paris Catacombs Tour',
        narration: 'Descend into Paris\'s mysterious underground ossuary. Explore tunnels lined with millions of bones and learn about this haunting piece of Parisian history.',
        description: 'Guided tour of the underground Paris Catacombs',
        historicalInfo: 'The Catacombs were created in the late 1700s when overflowing cemeteries became a public health hazard.',
        yearBuilt: '1786-1788',
        architect: 'Charles-Axel Guillaumot'
      },
      it: {
        name: 'Tour delle Catacombe di Parigi',
        narration: 'Scendi nell\'ossario sotterraneo misterioso di Parigi. Esplora tunnel rivestiti di milioni di ossa e scopri questo pezzo inquietante della storia parigina.',
        description: 'Tour guidato delle Catacombe sotterranee di Parigi',
        historicalInfo: 'Le Catacombe furono create alla fine del 1700 quando i cimiteri traboccanti divennero un rischio per la salute pubblica.',
        yearBuilt: '1786-1788',
        architect: 'Charles-Axel Guillaumot'
      },
      ko: {
        name: '파리 카타콤 투어',
        narration: '파리의 신비로운 지하 납골당으로 내려가세요. 수백만 개의 뼈가 늘어선 터널을 탐험하고 파리 역사의 이 으스스한 부분에 대해 배우세요.',
        description: '지하 파리 카타콤 가이드 투어',
        historicalInfo: '카타콤은 1700년대 후반 넘치는 묘지가 공중 보건 위험이 되었을 때 만들어졌습니다.',
        yearBuilt: '1786-1788년',
        architect: '샤를-악셀 기요모'
      }
    }
  },
  // Additional London Activities  
  {
    id: 'harry-potter-studio-tour',
    cityId: 'london',
    name: 'Warner Bros. Studio Tour London - Harry Potter',
    lat: 51.6903,
    lng: -0.4180,
    radius: 100,
    narration: 'Step into the magical world of Harry Potter at Warner Bros. Studio Tour. Explore authentic sets, props, and costumes from the films.',
    description: 'Behind-the-scenes tour of Harry Potter film sets',
    category: 'Activity',
    detailedDescription: 'Experience the magic of Harry Potter like never before at the Warner Bros. Studio Tour London. Walk through the actual Great Hall, explore Diagon Alley, and see Hogwarts castle like the filmmakers intended. Discover original props, animatronics, and stunning sets that brought J.K. Rowling\'s wizarding world to life. Learn filmmaking secrets, see how special effects were created, and explore Platform 9¾ where you can board the actual Hogwarts Express. The tour includes Dumbledore\'s office, Hagrid\'s hut, the Forbidden Forest, and concludes with a breathtaking 1:24 scale model of Hogwarts castle. Perfect for fans of all ages.',
    photos: [
      'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=800',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
      'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800',
      'https://images.unsplash.com/photo-1604999333679-b86d54738315?w=800',
      'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=800'
    ],
    historicalInfo: 'The Warner Bros. Studio Tour opened in 2012, built on the actual sets where Harry Potter films were made.',
    yearBuilt: '2012',
    architect: 'Warner Bros.',
    translations: {
      en: {
        name: 'Warner Bros. Studio Tour London - Harry Potter',
        narration: 'Step into the magical world of Harry Potter at Warner Bros. Studio Tour. Explore authentic sets, props, and costumes from the films.',
        description: 'Behind-the-scenes tour of Harry Potter film sets',
        historicalInfo: 'The Warner Bros. Studio Tour opened in 2012, built on the actual sets where Harry Potter films were made.',
        yearBuilt: '2012',
        architect: 'Warner Bros.'
      },
      it: {
        name: 'Warner Bros. Studio Tour London - Harry Potter',
        narration: 'Entra nel mondo magico di Harry Potter al Warner Bros. Studio Tour. Esplora set autentici, oggetti di scena e costumi dei film.',
        description: 'Tour dietro le quinte dei set cinematografici di Harry Potter',
        historicalInfo: 'Il Warner Bros. Studio Tour ha aperto nel 2012, costruito sui set reali dove sono stati girati i film di Harry Potter.',
        yearBuilt: '2012',
        architect: 'Warner Bros.'
      },
      ko: {
        name: '워너 브라더스 스튜디오 투어 런던 - 해리 포터',
        narration: '워너 브라더스 스튜디오 투어에서 해리 포터의 마법 세계로 들어가세요. 영화의 진짜 세트, 소품, 의상을 탐험하세요.',
        description: '해리 포터 영화 세트 비하인드 투어',
        historicalInfo: '워너 브라더스 스튜디오 투어는 2012년에 열렸으며, 해리 포터 영화가 제작된 실제 세트에 건설되었습니다.',
        yearBuilt: '2012년',
        architect: '워너 브라더스'
      }
    }
  },
  {
    id: 'london-eye-fast-track',
    cityId: 'london',
    name: 'London Eye Fast-Track Experience',
    lat: 51.5033,
    lng: -0.1195,
    radius: 60,
    narration: 'Skip the queues and soar 135 meters above London on the iconic London Eye. Enjoy breathtaking 360-degree views of the city.',
    description: 'Fast-track access to the London Eye observation wheel',
    category: 'Activity',
    detailedDescription: 'Experience London from above with fast-track access to the London Eye, one of the world\'s most famous observation wheels. Skip the standard queues and board your climate-controlled capsule for a 30-minute rotation offering spectacular panoramic views. On clear days, see up to 40 kilometers across the city, spotting landmarks like Buckingham Palace, St. Paul\'s Cathedral, Big Ben, and the Tower of London. Learn about the city\'s history and architecture through the interactive guide on the 4D Cinema Experience (optional upgrade). The London Eye is particularly magical at sunset or after dark when the city lights sparkle below. Each capsule holds up to 25 people with ample space to move around and take photos from every angle.',
    photos: [
      'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800',
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
      'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=800',
      'https://images.unsplash.com/photo-1543832923-44667a44c804?w=800',
      'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=800',
      'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800'
    ],
    historicalInfo: 'The London Eye opened in 2000 as the world\'s tallest observation wheel, standing at 135 meters.',
    yearBuilt: '2000',
    architect: 'Marks Barfield Architects',
    translations: {
      en: {
        name: 'London Eye Fast-Track Experience',
        narration: 'Skip the queues and soar 135 meters above London on the iconic London Eye. Enjoy breathtaking 360-degree views of the city.',
        description: 'Fast-track access to the London Eye observation wheel',
        historicalInfo: 'The London Eye opened in 2000 as the world\'s tallest observation wheel.',
        yearBuilt: '2000',
        architect: 'Marks Barfield Architects'
      },
      it: {
        name: 'London Eye Esperienza Fast-Track',
        narration: 'Salta le code e vola a 135 metri sopra Londra sull\'iconico London Eye. Goditi viste mozzafiato a 360 gradi della città.',
        description: 'Accesso fast-track alla ruota panoramica London Eye',
        historicalInfo: 'Il London Eye ha aperto nel 2000 come la ruota panoramica più alta del mondo.',
        yearBuilt: '2000',
        architect: 'Marks Barfield Architects'
      },
      ko: {
        name: '런던 아이 패스트 트랙 체험',
        narration: '줄을 건너뛰고 상징적인 런던 아이를 타고 런던 위 135미터로 날아오르세요. 도시의 숨막히는 360도 전망을 즐기세요.',
        description: '런던 아이 관람차 패스트 트랙 입장',
        historicalInfo: '런던 아이는 2000년에 세계에서 가장 높은 관람차로 열렸습니다.',
        yearBuilt: '2000년',
        architect: '마크스 바필드 건축가'
      }
    }
  },
  {
    id: 'west-end-theatre-show',
    cityId: 'london',
    name: 'West End Theatre Show',
    lat: 51.5114,
    lng: -0.1281,
    radius: 50,
    narration: 'Experience world-class theatre in London\'s West End. Choose from spectacular musicals and acclaimed plays in historic venues.',
    description: 'Premium tickets to top West End theatre productions',
    category: 'Activity',
    detailedDescription: 'London\'s West End is the heart of British theatre, rivaling New York\'s Broadway for world-class productions. Choose from spectacular long-running musicals like The Phantom of the Opera, Les Misérables, Wicked, and The Lion King, or catch acclaimed new plays and revivals featuring top British and international talent. West End theatres are architectural gems, many dating back to the Victorian and Edwardian eras, offering an atmospheric setting that adds to the magic of live performance. Premium ticket packages often include best-available seating, interval drinks, and sometimes backstage tours or meet-and-greet opportunities. Shows typically run 2-3 hours with one interval. Book in advance for popular productions, especially during holiday seasons.',
    photos: [
      'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
      'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800',
      'https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
      'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800'
    ],
    historicalInfo: 'London\'s West End theatre district has been the center of British theatre since the 17th century.',
    yearBuilt: 'Historic tradition',
    architect: 'Various historic theatres',
    translations: {
      en: {
        name: 'West End Theatre Show',
        narration: 'Experience world-class theatre in London\'s West End. Choose from spectacular musicals and acclaimed plays in historic venues.',
        description: 'Premium tickets to top West End theatre productions',
        historicalInfo: 'London\'s West End has been the center of British theatre since the 17th century.',
        yearBuilt: 'Historic tradition',
        architect: 'Various historic theatres'
      },
      it: {
        name: 'Spettacolo Teatrale del West End',
        narration: 'Vivi il teatro di classe mondiale nel West End di Londra. Scegli tra spettacolari musical e acclamati spettacoli teatrali in luoghi storici.',
        description: 'Biglietti premium per le migliori produzioni teatrali del West End',
        historicalInfo: 'Il West End di Londra è stato il centro del teatro britannico dal XVII secolo.',
        yearBuilt: 'Tradizione storica',
        architect: 'Vari teatri storici'
      },
      ko: {
        name: '웨스트 엔드 연극 쇼',
        narration: '런던 웨스트 엔드에서 세계적인 연극을 경험하세요. 역사적인 장소에서 화려한 뮤지컬과 찬사를 받는 연극 중에서 선택하세요.',
        description: '최고의 웨스트 엔드 연극 프로덕션 프리미엄 티켓',
        historicalInfo: '런던 웨스트 엔드는 17세기부터 영국 연극의 중심지였습니다.',
        yearBuilt: '역사적 전통',
        architect: '다양한 역사적 극장'
      }
    }
  },
  
  // Cebu Activities
  {
    id: 'cebu-island-hopping',
    cityId: 'cebu',
    name: 'Island Hopping Tour',
    lat: 10.3157,
    lng: 123.8854,
    radius: 100,
    narration: 'Explore the stunning islands around Cebu on this full-day island hopping adventure. Visit pristine beaches, snorkel in crystal-clear waters, and enjoy a beach barbecue.',
    description: 'Full-day island hopping tour to Cebu\'s beautiful islands',
    category: 'Activity',
    detailedDescription: 'This island hopping tour takes you to some of Cebu\'s most beautiful islands including Nalusuan Island, Caohagan Island, and Hilutungan Island. Each stop offers unique experiences - from pristine white sand beaches perfect for sunbathing to vibrant coral reefs teeming with tropical fish ideal for snorkeling. The tour includes all equipment, lunch on the beach with fresh seafood barbecue, and experienced guides who know the best spots. Swim in crystal-clear turquoise waters, explore marine sanctuaries, and relax on secluded beaches. Transportation via traditional bancas (outrigger boats) adds to the authentic Filipino experience.',
    photos: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800'
    ],
    translations: {
      en: {
        name: 'Island Hopping Tour',
        narration: 'Explore the stunning islands around Cebu on this full-day island hopping adventure. Visit pristine beaches, snorkel in crystal-clear waters, and enjoy a beach barbecue.',
        description: 'Full-day island hopping tour to Cebu\'s beautiful islands',
        detailedDescription: 'This island hopping tour takes you to some of Cebu\'s most beautiful islands including Nalusuan Island, Caohagan Island, and Hilutungan Island. Each stop offers unique experiences - from pristine white sand beaches perfect for sunbathing to vibrant coral reefs teeming with tropical fish ideal for snorkeling. The tour includes all equipment, lunch on the beach with fresh seafood barbecue, and experienced guides who know the best spots. Swim in crystal-clear turquoise waters, explore marine sanctuaries, and relax on secluded beaches. Transportation via traditional bancas (outrigger boats) adds to the authentic Filipino experience.'
      },
      it: {
        name: 'Tour Isola in Isola',
        narration: 'Esplora le splendide isole intorno a Cebu in questa avventura di un\'intera giornata. Visita spiagge incontaminate, fai snorkeling in acque cristalline e goditi un barbecue sulla spiaggia.',
        description: 'Tour di un\'intera giornata alle bellissime isole di Cebu',
        detailedDescription: 'Questo tour isola in isola ti porta ad alcune delle isole più belle di Cebu tra cui Nalusuan Island, Caohagan Island e Hilutungan Island. Ogni tappa offre esperienze uniche - dalle spiagge di sabbia bianca incontaminate perfette per prendere il sole alle vivaci barriere coralline brulicanti di pesci tropicali ideali per lo snorkeling. Il tour include tutta l\'attrezzatura, pranzo sulla spiaggia con barbecue di pesce fresco e guide esperte che conoscono i posti migliori. Nuota in acque turchesi cristalline, esplora santuari marini e rilassati su spiagge isolate. Il trasporto tramite tradizionali bancas (barche con bilanciere) aggiunge all\'esperienza filippina autentica.'
      },
      ko: {
        name: '아일랜드 호핑 투어',
        narration: '이 하루 종일 아일랜드 호핑 모험에서 세부 주변의 멋진 섬들을 탐험하세요. 깨끗한 해변을 방문하고, 수정처럼 맑은 물에서 스노클링을 하고, 해변 바비큐를 즐기세요.',
        description: '세부의 아름다운 섬들로의 하루 종일 아일랜드 호핑 투어',
        detailedDescription: '이 아일랜드 호핑 투어는 날루수안 섬, 카오하간 섬, 힐루툰간 섬을 포함한 세부의 가장 아름다운 섬들로 여러분을 안내합니다. 각 정류장은 독특한 경험을 제공합니다 - 일광욕에 완벽한 깨끗한 백사장부터 스노클링에 이상적인 열대어가 가득한 활기찬 산호초까지. 투어에는 모든 장비, 신선한 해산물 바비큐와 함께하는 해변 점심, 그리고 최고의 장소를 아는 경험 많은 가이드가 포함됩니다. 수정처럼 맑은 청록색 바다에서 수영하고, 해양 보호구역을 탐험하고, 한적한 해변에서 휴식을 취하세요. 전통적인 방카(외지거 보트)를 통한 이동은 진정한 필리핀 경험을 더합니다.'
      }
    }
  },
  {
    id: 'oslob-whale-shark',
    cityId: 'cebu',
    name: 'Oslob Whale Shark Watching',
    lat: 9.5000,
    lng: 123.4000,
    radius: 80,
    narration: 'Experience the thrill of swimming alongside gentle giant whale sharks in Oslob. This bucket-list experience brings you face-to-face with the world\'s largest fish.',
    description: 'Swim with whale sharks in their natural habitat',
    category: 'Activity',
    detailedDescription: 'Oslob offers one of the most reliable whale shark encounters in the world. These gentle giants, the largest fish in the ocean, gather in the warm waters off Oslob year-round. The experience begins early morning when the water is calmest and the whale sharks are most active. After a safety briefing, you\'ll wade into the shallow waters where these magnificent creatures feed. Swimming alongside a 20-foot whale shark is truly awe-inspiring - they glide gracefully through the water, completely unbothered by human presence. The tour includes snorkeling equipment, life jackets, experienced guides, and underwater photography opportunities. Strict conservation rules ensure both your safety and the whale sharks\' wellbeing.',
    photos: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
    ],
    translations: {
      en: {
        name: 'Oslob Whale Shark Watching',
        narration: 'Experience the thrill of swimming alongside gentle giant whale sharks in Oslob. This bucket-list experience brings you face-to-face with the world\'s largest fish.',
        description: 'Swim with whale sharks in their natural habitat'
      },
      it: {
        name: 'Osservazione Squali Balena a Oslob',
        narration: 'Vivi l\'emozione di nuotare accanto ai gentili squali balena giganti a Oslob. Questa esperienza da lista dei desideri ti porta faccia a faccia con il pesce più grande del mondo.',
        description: 'Nuota con gli squali balena nel loro habitat naturale',
        detailedDescription: 'Oslob offre uno degli incontri con squali balena più affidabili al mondo. Questi gentili giganti, i pesci più grandi dell\'oceano, si radunano nelle calde acque al largo di Oslob tutto l\'anno. L\'esperienza inizia di prima mattina quando l\'acqua è più calma e gli squali balena sono più attivi. Dopo un briefing sulla sicurezza, entrerai nelle acque poco profonde dove queste magnifiche creature si nutrono. Nuotare accanto a uno squalo balena di 6 metri è davvero maestoso - scivolano con grazia nell\'acqua, completamente indisturbati dalla presenza umana. Il tour include attrezzatura da snorkeling, giubbotti di salvataggio, guide esperte e opportunità di fotografia subacquea. Rigide regole di conservazione garantiscono sia la tua sicurezza che il benessere degli squali balena.'
      },
      ko: {
        name: '오슬롭 고래상어 관찰',
        narration: '오슬롭에서 온순한 거대 고래상어와 함께 수영하는 스릴을 경험하세요. 이 버킷리스트 경험은 세계에서 가장 큰 물고기와 대면하게 합니다.',
        description: '자연 서식지에서 고래상어와 함께 수영',
        detailedDescription: '오슬롭은 세계에서 가장 신뢰할 수 있는 고래상어 만남 중 하나를 제공합니다. 바다에서 가장 큰 물고기인 이 온순한 거인들은 일년 내내 오슬롭의 따뜻한 바다에 모입니다. 경험은 물이 가장 잔잔하고 고래상어가 가장 활동적인 이른 아침에 시작됩니다. 안전 교육 후, 이 장엄한 생물들이 먹이를 먹는 얕은 물로 들어갑니다. 6미터 고래상어와 함께 수영하는 것은 정말 경외심을 불러일으킵니다 - 그들은 인간의 존재에 전혀 방해받지 않고 물속에서 우아하게 미끄러집니다. 투어에는 스노클링 장비, 구명 조끼, 경험 많은 가이드, 수중 사진 촬영 기회가 포함됩니다. 엄격한 보존 규칙은 여러분의 안전과 고래상어의 복지를 모두 보장합니다.'
      }
    }
  },
  {
    id: 'kawasan-canyoneering',
    cityId: 'cebu',
    name: 'Canyoneering Adventure at Kawasan Falls',
    lat: 9.8167,
    lng: 123.3667,
    radius: 70,
    narration: 'Embark on an adrenaline-pumping canyoneering adventure through Kawasan Falls. Jump off cliffs, swim through canyons, and rappel down waterfalls.',
    description: 'Thrilling canyoneering experience at Kawasan Falls',
    category: 'Activity',
    detailedDescription: 'The Kawasan Canyoneering adventure is one of Cebu\'s most exhilarating outdoor activities. This full-day adventure takes you through stunning canyons carved by crystal-clear turquoise waters over millions of years. The journey includes cliff jumping from various heights (optional - you can always walk around), swimming through narrow gorges, scrambling over rocks, and rappelling down cascading waterfalls. The highlight is the spectacular Kawasan Falls with its stunning multi-tiered cascades and vibrant blue pools. All necessary equipment including helmets, life jackets, and ropes are provided. Expert guides ensure safety while encouraging you to push your limits. No prior experience needed, but good swimming skills and physical fitness are recommended.',
    photos: [
      'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?w=800'
    ],
    translations: {
      en: {
        name: 'Canyoneering Adventure at Kawasan Falls',
        narration: 'Embark on an adrenaline-pumping canyoneering adventure through Kawasan Falls. Jump off cliffs, swim through canyons, and rappel down waterfalls.',
        description: 'Thrilling canyoneering experience at Kawasan Falls'
      },
      it: {
        name: 'Avventura Canyoning alle Cascate Kawasan',
        narration: 'Inizia un\'avventura di canyoning piena di adrenalina attraverso le Cascate Kawasan. Salta dalle scogliere, nuota attraverso i canyon e scendi in corda doppia dalle cascate.',
        description: 'Esperienza emozionante di canyoning alle Cascate Kawasan',
        detailedDescription: 'L\'avventura di canyoning a Kawasan è una delle attività all\'aperto più esaltanti di Cebu. Questa avventura di un\'intera giornata ti porta attraverso canyon spettacolari scolpiti da acque turchesi cristalline nel corso di milioni di anni. Il percorso include salti da scogliere di varie altezze (opzionale - puoi sempre aggirare a piedi), nuotate attraverso gole strette, arrampicate su rocce e discese in corda doppia lungo cascate scroscianti. Il culmine sono le spettacolari Cascate Kawasan con le loro cascate a più livelli e piscine blu vibranti. Tutta l\'attrezzatura necessaria inclusi caschi, giubbotti di salvataggio e corde è fornita. Guide esperte garantiscono la sicurezza mentre ti incoraggiano a superare i tuoi limiti. Non è richiesta esperienza precedente, ma sono raccomandate buone capacità di nuoto e forma fisica.'
      },
      ko: {
        name: '카와산 폭포 캐니어링 어드벤처',
        narration: '카와산 폭포를 통과하는 아드레날린이 솟구치는 캐니어링 모험을 시작하세요. 절벽에서 뛰어내리고, 협곡을 헤엄치고, 폭포를 따라 하강하세요.',
        description: '카와산 폭포에서의 스릴 넘치는 캐니어링 경험',
        detailedDescription: '카와산 캐니어링 모험은 세부에서 가장 짜릿한 야외 활동 중 하나입니다. 이 하루 종일 모험은 수백만 년에 걸쳐 수정처럼 맑은 청록색 물이 조각한 멋진 협곡을 통과합니다. 여정에는 다양한 높이에서의 절벽 점프(선택 사항 - 언제든지 걸어서 우회 가능), 좁은 협곡을 헤엄치기, 바위를 오르기, 쏟아지는 폭포를 따라 하강하기가 포함됩니다. 하이라이트는 멋진 다단계 폭포와 생생한 푸른 웅덩이가 있는 장관인 카와산 폭포입니다. 헬멧, 구명 조끼, 로프를 포함한 모든 필요한 장비가 제공됩니다. 전문 가이드가 안전을 보장하면서 한계를 뛰어넘도록 격려합니다. 사전 경험은 필요하지 않지만 좋은 수영 능력과 체력이 권장됩니다.'
      }
    }
  },
  
  // Singapore Activities
  {
    id: 'gardens-by-the-bay-night',
    cityId: 'singapore',
    name: 'Gardens by the Bay Night Tour',
    lat: 1.2816,
    lng: 103.8636,
    radius: 60,
    narration: 'Experience the magical Gardens by the Bay after dark. Watch the stunning light and sound show at the Supertree Grove and explore the illuminated Cloud Forest.',
    description: 'Evening tour of Gardens by the Bay with light show',
    category: 'Activity',
    detailedDescription: 'Gardens by the Bay transforms into a magical wonderland after sunset. This evening tour takes you through the futuristic Supertree Grove where towering vertical gardens reach up to 50 meters high. The highlight is the Garden Rhapsody - a spectacular light and sound show that illuminates the Supertrees in a symphony of colors synchronized to music. The tour also includes the Cloud Forest, where the world\'s tallest indoor waterfall cascades 35 meters surrounded by lush vegetation and ethereal mist. Walk along the OCBC Skyway, a 128-meter aerial walkway connecting the Supertrees 22 meters above ground, offering stunning views of Marina Bay. The cooler evening temperatures make exploring more comfortable while the dramatic lighting creates perfect photo opportunities.',
    photos: [
      'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
      'https://images.unsplash.com/photo-1562992468-ccf2c7f0c09d?w=800',
      'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800'
    ],
    translations: {
      en: {
        name: 'Gardens by the Bay Night Tour',
        narration: 'Experience the magical Gardens by the Bay after dark. Watch the stunning light and sound show at the Supertree Grove and explore the illuminated Cloud Forest.',
        description: 'Evening tour of Gardens by the Bay with light show'
      },
      it: {
        name: 'Tour Notturno dei Gardens by the Bay',
        narration: 'Vivi i magici Gardens by the Bay dopo il tramonto. Guarda lo spettacolare spettacolo di luci e suoni al Supertree Grove ed esplora la Cloud Forest illuminata.',
        description: 'Tour serale dei Gardens by the Bay con spettacolo di luci',
        detailedDescription: 'I Gardens by the Bay si trasformano in un magico paese delle meraviglie dopo il tramonto. Questo tour serale ti porta attraverso il futuristico Supertree Grove dove i giardini verticali torreggianti raggiungono i 50 metri di altezza. Il momento clou è il Garden Rhapsody - uno spettacolare spettacolo di luci e suoni che illumina i Supertree in una sinfonia di colori sincronizzata con la musica. Il tour include anche la Cloud Forest, dove la cascata interna più alta del mondo precipita per 35 metri circondata da vegetazione lussureggiante e nebbia eterea. Cammina lungo l\'OCBC Skyway, una passerella aerea di 128 metri che collega i Supertree a 22 metri dal suolo, offrendo viste mozzafiato di Marina Bay. Le temperature serali più fresche rendono l\'esplorazione più confortevole mentre l\'illuminazione drammatica crea perfette opportunità fotografiche.'
      },
      ko: {
        name: '가든스 바이 더 베이 야간 투어',
        narration: '어둠 속에서 마법 같은 가든스 바이 더 베이를 경험하세요. 슈퍼트리 그로브에서 멋진 빛과 소리 쇼를 보고 조명이 켜진 클라우드 포레스트를 탐험하세요.',
        description: '라이트 쇼가 있는 가든스 바이 더 베이 저녁 투어',
        detailedDescription: '가든스 바이 더 베이는 일몰 후 마법의 원더랜드로 변신합니다. 이 저녁 투어는 높이 50미터에 달하는 수직 정원이 솟아 있는 미래적인 슈퍼트리 그로브를 안내합니다. 하이라이트는 가든 랩소디 - 음악에 맞춰 슈퍼트리를 색상의 교향곡으로 비추는 화려한 빛과 소리 쇼입니다. 투어에는 무성한 식물과 환상적인 안개에 둘러싸인 세계에서 가장 높은 실내 폭포가 35미터를 쏟아지는 클라우드 포레스트도 포함됩니다. 지상 22미터에서 슈퍼트리를 연결하는 128미터의 공중 산책로인 OCBC 스카이웨이를 따라 걸으며 마리나 베이의 멋진 전망을 즐기세요. 시원한 저녁 기온은 탐험을 더 편안하게 만들고 극적인 조명은 완벽한 사진 촬영 기회를 만듭니다.'
      }
    }
  },
  {
    id: 'singapore-river-cruise',
    cityId: 'singapore',
    name: 'Singapore River Bumboat Cruise',
    lat: 1.2875,
    lng: 103.8511,
    radius: 50,
    narration: 'Cruise along the historic Singapore River on a traditional bumboat. Discover the city\'s heritage as you glide past colonial buildings, modern skyscrapers, and vibrant quaysides.',
    description: 'Traditional bumboat cruise along Singapore River',
    category: 'Activity',
    detailedDescription: 'The Singapore River Cruise offers a unique perspective on the city\'s transformation from fishing village to global metropolis. Board a traditional bumboat - once used to transport goods and passengers - and glide along the historic waterway. The cruise passes through three distinct quays: Boat Quay with its colorful shophouses and lively restaurants, Clarke Quay\'s modern entertainment complex, and Robertson Quay\'s quieter residential charm. Along the way, see iconic landmarks including the Merlion, Esplanade, Marina Bay Sands, and Fullerton Hotel. Audio commentary in multiple languages shares fascinating stories about Singapore\'s history, architecture, and cultural heritage. Evening cruises are particularly magical when the city lights reflect on the water.',
    photos: [
      'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800',
      'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800'
    ],
    translations: {
      en: {
        name: 'Singapore River Bumboat Cruise',
        narration: 'Cruise along the historic Singapore River on a traditional bumboat. Discover the city\'s heritage as you glide past colonial buildings, modern skyscrapers, and vibrant quaysides.',
        description: 'Traditional bumboat cruise along Singapore River'
      },
      it: {
        name: 'Crociera in Bumboat sul Fiume Singapore',
        narration: 'Naviga lungo lo storico fiume Singapore su un tradizionale bumboat. Scopri il patrimonio della città mentre scivoli accanto a edifici coloniali, grattacieli moderni e banchine vivaci.',
        description: 'Crociera tradizionale in bumboat lungo il fiume Singapore',
        detailedDescription: 'La crociera sul fiume Singapore offre una prospettiva unica sulla trasformazione della città da villaggio di pescatori a metropoli globale. Sali a bordo di un tradizionale bumboat - un tempo utilizzato per trasportare merci e passeggeri - e scivola lungo lo storico corso d\'acqua. La crociera attraversa tre banchine distinte: Boat Quay con le sue colorate shophouse e ristoranti vivaci, il moderno complesso di intrattenimento di Clarke Quay e il fascino residenziale più tranquillo di Robertson Quay. Lungo il percorso, ammira monumenti iconici tra cui il Merlion, l\'Esplanade, Marina Bay Sands e il Fullerton Hotel. Il commento audio in più lingue condivide storie affascinanti sulla storia, architettura e patrimonio culturale di Singapore. Le crociere serali sono particolarmente magiche quando le luci della città si riflettono sull\'acqua.'
      },
      ko: {
        name: '싱가포르 리버 범보트 크루즈',
        narration: '전통적인 범보트를 타고 역사적인 싱가포르 강을 따라 크루즈하세요. 식민지 건물, 현대적인 고층 빌딩, 활기찬 부두를 지나가며 도시의 유산을 발견하세요.',
        description: '싱가포르 강을 따라 전통 범보트 크루즈',
        detailedDescription: '싱가포르 리버 크루즈는 어촌 마을에서 글로벌 대도시로의 도시 변화에 대한 독특한 관점을 제공합니다. 한때 상품과 승객을 운송하는 데 사용되었던 전통적인 범보트에 탑승하여 역사적인 수로를 따라 미끄러지세요. 크루즈는 세 개의 구별된 부두를 통과합니다: 화려한 샵하우스와 활기찬 레스토랑이 있는 보트 키, 클라크 키의 현대적인 엔터테인먼트 단지, 그리고 로버트슨 키의 더 조용한 주거 매력. 길을 따라 멀라이언, 에스플러네이드, 마리나 베이 샌즈, 풀러턴 호텔을 포함한 상징적인 랜드마크를 볼 수 있습니다. 여러 언어로 제공되는 오디오 해설은 싱가포르의 역사, 건축, 문화 유산에 대한 매혹적인 이야기를 공유합니다. 도시의 불빛이 물에 반사될 때 저녁 크루즈는 특히 마법 같습니다.'
      }
    }
  },
  {
    id: 'singapore-hawker-food-tour',
    cityId: 'singapore',
    name: 'Hawker Center Food Tour',
    lat: 1.2884,
    lng: 103.8478,
    radius: 70,
    narration: 'Embark on a culinary journey through Singapore\'s famous hawker centers. Taste authentic local dishes and learn about the multicultural food heritage.',
    description: 'Guided food tour exploring Singapore\'s hawker cuisine',
    category: 'Activity',
    detailedDescription: 'Singapore\'s hawker centers are the heart and soul of the city\'s food culture, recognized by UNESCO as an Intangible Cultural Heritage. This guided food tour takes you to the best hawker stalls to sample iconic Singaporean dishes like Hainanese chicken rice, laksa, char kway teow, satay, and roti prata. Your local guide shares the history behind each dish and the stories of the hawkers who have perfected their recipes over generations. Learn about Singapore\'s multicultural influences - Chinese, Malay, Indian, and Peranakan - all reflected in the diverse cuisine. The tour visits multiple hawker centers including Maxwell Food Centre and Lau Pa Sat, ensuring you taste the most authentic and delicious offerings. Come hungry - you\'ll sample 8-10 different dishes!',
    photos: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800'
    ],
    translations: {
      en: {
        name: 'Hawker Center Food Tour',
        narration: 'Embark on a culinary journey through Singapore\'s famous hawker centers. Taste authentic local dishes and learn about the multicultural food heritage.',
        description: 'Guided food tour exploring Singapore\'s hawker cuisine'
      },
      it: {
        name: 'Tour Gastronomico nei Hawker Center',
        narration: 'Inizia un viaggio culinario attraverso i famosi hawker center di Singapore. Assaggia piatti locali autentici e scopri il patrimonio gastronomico multiculturale.',
        description: 'Tour gastronomico guidato per esplorare la cucina hawker di Singapore',
        detailedDescription: 'I hawker center di Singapore sono il cuore e l\'anima della cultura gastronomica della città, riconosciuti dall\'UNESCO come Patrimonio Culturale Immateriale. Questo tour gastronomico guidato ti porta alle migliori bancarelle hawker per assaggiare piatti singaporiani iconici come il riso al pollo hainanese, laksa, char kway teow, satay e roti prata. La tua guida locale condivide la storia dietro ogni piatto e le storie degli hawker che hanno perfezionato le loro ricette nel corso di generazioni. Scopri le influenze multiculturali di Singapore - cinese, malese, indiana e Peranakan - tutte riflesse nella cucina diversificata. Il tour visita molteplici hawker center tra cui Maxwell Food Centre e Lau Pa Sat, assicurando che assaggi le offerte più autentiche e deliziose. Vieni affamato - assaggerai 8-10 piatti diversi!'
      },
      ko: {
        name: '호커 센터 푸드 투어',
        narration: '싱가포르의 유명한 호커 센터를 통한 요리 여행을 시작하세요. 정통 현지 요리를 맛보고 다문화 음식 유산에 대해 배우세요.',
        description: '싱가포르 호커 요리를 탐험하는 가이드 푸드 투어',
        detailedDescription: '싱가포르의 호커 센터는 도시 음식 문화의 심장과 영혼이며, 유네스코 무형 문화유산으로 인정받았습니다. 이 가이드 푸드 투어는 하이난식 치킨 라이스, 락사, 차 콰이 티오, 사테, 로티 프라타와 같은 상징적인 싱가포르 요리를 맛보기 위해 최고의 호커 가판대로 안내합니다. 현지 가이드가 각 요리 뒤의 역사와 여러 세대에 걸쳐 레시피를 완성한 호커들의 이야기를 공유합니다. 중국, 말레이, 인도, 페라나칸 등 다양한 요리에 반영된 싱가포르의 다문화 영향에 대해 배우세요. 투어는 맥스웰 푸드 센터와 라우 파 사트를 포함한 여러 호커 센터를 방문하여 가장 정통적이고 맛있는 음식을 맛볼 수 있도록 합니다. 배고픈 상태로 오세요 - 8-10가지 다른 요리를 맛보게 됩니다!'
      }
    }
  },
  
  // Penang Activities
  {
    id: 'georgetown-street-art',
    cityId: 'penang',
    name: 'Georgetown Street Art Tour',
    lat: 5.4141,
    lng: 100.3288,
    radius: 60,
    narration: 'Discover Georgetown\'s vibrant street art scene on this walking tour. Find famous murals, learn their stories, and explore the UNESCO World Heritage city.',
    description: 'Walking tour of Georgetown\'s famous street art and murals',
    category: 'Activity',
    detailedDescription: 'Georgetown\'s street art has transformed the UNESCO World Heritage city into an open-air gallery. This guided walking tour takes you to the most famous murals by Lithuanian artist Ernest Zacharevic and local artists. See the iconic "Little Children on a Bicycle," "Boy on a Bike," and dozens of other creative works that blend art with the city\'s historic architecture. Your guide shares the stories behind each artwork and Georgetown\'s transformation into Southeast Asia\'s street art capital. The tour also explores the city\'s multicultural heritage, visiting temples, mosques, churches, and clan houses along the way. You\'ll discover hidden alleyways, colonial buildings, and local markets while learning about Penang\'s rich history. Comfortable walking shoes recommended - the tour covers about 3-4 kilometers.',
    photos: [
      'https://images.unsplash.com/photo-1583209343135-9848e8e9eb0d?w=800',
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800'
    ],
    translations: {
      en: {
        name: 'Georgetown Street Art Tour',
        narration: 'Discover Georgetown\'s vibrant street art scene on this walking tour. Find famous murals, learn their stories, and explore the UNESCO World Heritage city.',
        description: 'Walking tour of Georgetown\'s famous street art and murals',
        detailedDescription: 'Georgetown\'s street art has transformed the UNESCO World Heritage city into an open-air gallery. This guided walking tour takes you to the most famous murals by Lithuanian artist Ernest Zacharevic and local artists. See the iconic "Little Children on a Bicycle," "Boy on a Bike," and dozens of other creative works that blend art with the city\'s historic architecture. Your guide shares the stories behind each artwork and Georgetown\'s transformation into Southeast Asia\'s street art capital. The tour also explores the city\'s multicultural heritage, visiting temples, mosques, churches, and clan houses along the way. You\'ll discover hidden alleyways, colonial buildings, and local markets while learning about Penang\'s rich history. Comfortable walking shoes recommended - the tour covers about 3-4 kilometers.'
      },
      it: {
        name: 'Tour della Street Art di Georgetown',
        narration: 'Scopri la vivace scena della street art di Georgetown in questo tour a piedi. Trova murales famosi, scopri le loro storie ed esplora la città Patrimonio dell\'Umanità UNESCO.',
        description: 'Tour a piedi della famosa street art e murales di Georgetown',
        detailedDescription: 'La street art di Georgetown ha trasformato la città Patrimonio dell\'Umanità UNESCO in una galleria a cielo aperto. Questo tour a piedi guidato ti porta ai murales più famosi dell\'artista lituano Ernest Zacharevic e di artisti locali. Ammira l\'iconico "Little Children on a Bicycle", "Boy on a Bike" e dozzine di altre opere creative che fondono l\'arte con l\'architettura storica della città. La tua guida condivide le storie dietro ogni opera d\'arte e la trasformazione di Georgetown nella capitale della street art del Sud-Est asiatico. Il tour esplora anche il patrimonio multiculturale della città, visitando templi, moschee, chiese e case dei clan lungo il percorso. Scoprirai vicoli nascosti, edifici coloniali e mercati locali mentre impari sulla ricca storia di Penang. Scarpe comode da passeggio raccomandate - il tour copre circa 3-4 chilometri.'
      },
      ko: {
        name: '조지타운 스트리트 아트 투어',
        narration: '이 도보 투어에서 조지타운의 활기찬 스트리트 아트 현장을 발견하세요. 유명한 벽화를 찾고, 그들의 이야기를 배우고, 유네스코 세계 문화유산 도시를 탐험하세요.',
        description: '조지타운의 유명한 스트리트 아트와 벽화 도보 투어',
        detailedDescription: '조지타운의 스트리트 아트는 유네스코 세계 문화유산 도시를 야외 갤러리로 변모시켰습니다. 이 가이드 도보 투어는 리투아니아 예술가 어니스트 자카레빅과 지역 예술가들의 가장 유명한 벽화로 안내합니다. 상징적인 "자전거를 탄 어린이들", "자전거를 탄 소년", 그리고 도시의 역사적 건축물과 예술을 융합한 수십 개의 다른 창의적인 작품을 보세요. 가이드가 각 예술 작품 뒤의 이야기와 동남아시아의 스트리트 아트 수도로의 조지타운 변모에 대해 공유합니다. 투어는 또한 도시의 다문화 유산을 탐험하며 길을 따라 사원, 모스크, 교회, 씨족 가옥을 방문합니다. 페낭의 풍부한 역사에 대해 배우면서 숨겨진 골목길, 식민지 건물, 지역 시장을 발견하게 됩니다. 편안한 워킹화 권장 - 투어는 약 3-4킬로미터를 다룹니다.'
      }
    }
  },
  {
    id: 'penang-hill-cable-car',
    cityId: 'penang',
    name: 'Penang Hill Funicular Railway Experience',
    lat: 5.4239,
    lng: 100.2733,
    radius: 50,
    narration: 'Ride the historic funicular railway to the top of Penang Hill. Enjoy panoramic views of the island, explore colonial bungalows, and experience cooler mountain air.',
    description: 'Funicular railway ride to Penang Hill summit',
    category: 'Activity',
    detailedDescription: 'Penang Hill offers a refreshing escape from the tropical heat and spectacular views of the island. The journey begins with a scenic ride on the funicular railway, one of the oldest in Asia, climbing 833 meters through lush rainforest. At the summit, temperatures are typically 5-7°C cooler than sea level, providing welcome relief. Explore the hill\'s attractions including The Habitat, a nature discovery center with canopy walkways offering stunning views; colonial-era bungalows showcasing British heritage; Hindu and Muslim shrines; and the Love Lock terrace where couples attach padlocks as symbols of eternal love. The panoramic vistas encompass Georgetown, the mainland, and on clear days, even Thailand. Visit at sunset for the most breathtaking views as the city lights begin to twinkle below.',
    photos: [
      'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
    ],
    translations: {
      en: {
        name: 'Penang Hill Funicular Railway Experience',
        narration: 'Ride the historic funicular railway to the top of Penang Hill. Enjoy panoramic views of the island, explore colonial bungalows, and experience cooler mountain air.',
        description: 'Funicular railway ride to Penang Hill summit',
        detailedDescription: 'Penang Hill offers a refreshing escape from the tropical heat and spectacular views of the island. The journey begins with a scenic ride on the funicular railway, one of the oldest in Asia, climbing 833 meters through lush rainforest. At the summit, temperatures are typically 5-7°C cooler than sea level, providing welcome relief. Explore the hill\'s attractions including The Habitat, a nature discovery center with canopy walkways offering stunning views; colonial-era bungalows showcasing British heritage; Hindu and Muslim shrines; and the Love Lock terrace where couples attach padlocks as symbols of eternal love. The panoramic vistas encompass Georgetown, the mainland, and on clear days, even Thailand. Visit at sunset for the most breathtaking views as the city lights begin to twinkle below.'
      },
      it: {
        name: 'Esperienza della Funicolare di Penang Hill',
        narration: 'Sali sulla storica funicolare fino alla cima di Penang Hill. Goditi viste panoramiche dell\'isola, esplora bungalow coloniali e sperimenta l\'aria fresca di montagna.',
        description: 'Corsa in funicolare fino alla cima di Penang Hill',
        detailedDescription: 'Penang Hill offre una fuga rinfrescante dal caldo tropicale e viste spettacolari dell\'isola. Il viaggio inizia con una corsa panoramica sulla funicolare, una delle più antiche d\'Asia, che sale 833 metri attraverso la lussureggiante foresta pluviale. In cima, le temperature sono tipicamente 5-7°C più fresche rispetto al livello del mare, offrendo un sollievo benvenuto. Esplora le attrazioni della collina tra cui The Habitat, un centro di scoperta della natura con passerelle tra le chiome degli alberi che offrono viste mozzafiato; bungalow dell\'epoca coloniale che mostrano il patrimonio britannico; santuari indù e musulmani; e la terrazza Love Lock dove le coppie attaccano lucchetti come simboli di amore eterno. Le viste panoramiche comprendono Georgetown, la terraferma e, nelle giornate limpide, persino la Thailandia. Visita al tramonto per le viste più mozzafiato mentre le luci della città iniziano a brillare sotto.'
      },
      ko: {
        name: '페낭 힐 케이블카 체험',
        narration: '역사적인 케이블카를 타고 페낭 힐 정상까지 올라가세요. 섬의 파노라마 전망을 즐기고, 식민지 시대 방갈로를 탐험하고, 시원한 산 공기를 경험하세요.',
        description: '페낭 힐 정상까지 케이블카 타기',
        detailedDescription: '페낭 힐은 열대 더위로부터의 상쾌한 탈출과 섬의 장관을 이루는 전망을 제공합니다. 여정은 아시아에서 가장 오래된 케이블카 중 하나를 타고 울창한 열대우림을 통과하며 833미터를 올라가는 경치 좋은 여행으로 시작됩니다. 정상에서는 기온이 일반적으로 해수면보다 5-7°C 더 시원하여 반가운 안도감을 제공합니다. 멋진 전망을 제공하는 캐노피 워크웨이가 있는 자연 발견 센터인 The Habitat, 영국 유산을 보여주는 식민지 시대 방갈로, 힌두교 및 이슬람 신전, 그리고 커플들이 영원한 사랑의 상징으로 자물쇠를 달아두는 러브 락 테라스를 포함한 언덕의 명소를 탐험하세요. 파노라마 전망은 조지타운, 본토, 그리고 맑은 날에는 태국까지 포함합니다. 도시의 불빛이 아래에서 반짝이기 시작하는 일몰 시간에 방문하여 가장 숨막히는 전망을 즐기세요.'
      }
    }
  },
  {
    id: 'nyonya-cooking-class',
    cityId: 'penang',
    name: 'Traditional Nyonya Cooking Class',
    lat: 5.4164,
    lng: 100.3400,
    radius: 40,
    narration: 'Learn to cook authentic Nyonya cuisine in this hands-on cooking class. Discover the unique Peranakan culinary traditions blending Chinese and Malay flavors.',
    description: 'Hands-on Nyonya cooking class with market visit',
    category: 'Activity',
    detailedDescription: 'Nyonya cuisine, also known as Peranakan food, represents a unique fusion of Chinese and Malay culinary traditions developed over centuries in Penang. This immersive cooking class begins with a visit to a local market where your instructor explains exotic ingredients like bunga kantan (torch ginger), daun kesom (laksa leaves), and belacan (shrimp paste). Return to a traditional Peranakan home or cooking school to prepare 3-4 signature dishes which might include laksa lemak, ayam pongteh (chicken braised in fermented bean paste), or kueh pie tee (crispy shells with vegetables). Learn essential techniques like pounding rempah (spice paste) in a traditional mortar and achieving the perfect balance of sweet, sour, salty, and spicy flavors. The class concludes with enjoying your creations together. Recipe cards provided so you can recreate the dishes at home.',
    photos: [
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800'
    ],
    translations: {
      en: {
        name: 'Traditional Nyonya Cooking Class',
        narration: 'Learn to cook authentic Nyonya cuisine in this hands-on cooking class. Discover the unique Peranakan culinary traditions blending Chinese and Malay flavors.',
        description: 'Hands-on Nyonya cooking class with market visit',
        detailedDescription: 'Nyonya cuisine, also known as Peranakan food, represents a unique fusion of Chinese and Malay culinary traditions developed over centuries in Penang. This immersive cooking class begins with a visit to a local market where your instructor explains exotic ingredients like bunga kantan (torch ginger), daun kesom (laksa leaves), and belacan (shrimp paste). Return to a traditional Peranakan home or cooking school to prepare 3-4 signature dishes which might include laksa lemak, ayam pongteh (chicken braised in fermented bean paste), or kueh pie tee (crispy shells with vegetables). Learn essential techniques like pounding rempah (spice paste) in a traditional mortar and achieving the perfect balance of sweet, sour, salty, and spicy flavors. The class concludes with enjoying your creations together. Recipe cards provided so you can recreate the dishes at home.'
      },
      it: {
        name: 'Corso di Cucina Nyonya Tradizionale',
        narration: 'Impara a cucinare l\'autentica cucina Nyonya in questo corso di cucina pratico. Scopri le uniche tradizioni culinarie Peranakan che fondono sapori cinesi e malesi.',
        description: 'Corso di cucina Nyonya pratico con visita al mercato',
        detailedDescription: 'La cucina Nyonya, conosciuta anche come cibo Peranakan, rappresenta una fusione unica di tradizioni culinarie cinesi e malesi sviluppate nel corso di secoli a Penang. Questo corso di cucina immersivo inizia con una visita a un mercato locale dove il tuo istruttore spiega ingredienti esotici come bunga kantan (zenzero torcia), daun kesom (foglie di laksa) e belacan (pasta di gamberetti). Torna in una tradizionale casa Peranakan o scuola di cucina per preparare 3-4 piatti caratteristici che potrebbero includere laksa lemak, ayam pongteh (pollo brasato in pasta di fagioli fermentati) o kueh pie tee (gusci croccanti con verdure). Impara tecniche essenziali come pestare il rempah (pasta di spezie) in un mortaio tradizionale e raggiungere il perfetto equilibrio di sapori dolci, acidi, salati e piccanti. Il corso si conclude gustando insieme le tue creazioni. Schede ricette fornite così puoi ricreare i piatti a casa.'
      },
      ko: {
        name: '전통 뇨냐 요리 수업',
        narration: '이 실습 요리 수업에서 정통 뇨냐 요리를 배우세요. 중국과 말레이 풍미를 혼합한 독특한 페라나칸 요리 전통을 발견하세요.',
        description: '시장 방문이 포함된 실습 뇨냐 요리 수업',
        detailedDescription: '페라나칸 음식으로도 알려진 뇨냐 요리는 페낭에서 수세기에 걸쳐 발전한 중국과 말레이 요리 전통의 독특한 융합을 나타냅니다. 이 몰입형 요리 수업은 강사가 붕아 칸탄(토치 생강), 다운 케솜(락사 잎), 블라칸(새우 페이스트)과 같은 이국적인 재료를 설명하는 지역 시장 방문으로 시작됩니다. 전통적인 페라나칸 가정이나 요리 학교로 돌아와 락사 레막, 아얌 퐁테(발효 콩 페이스트에 조린 닭고기) 또는 쿠에 파이 티(야채를 넣은 바삭한 껍질)를 포함할 수 있는 3-4가지 대표 요리를 준비합니다. 전통 절구에서 렘파(향신료 페이스트)를 찧는 것과 단맛, 신맛, 짠맛, 매운맛의 완벽한 균형을 이루는 것과 같은 필수 기술을 배우세요. 수업은 함께 여러분의 창작물을 즐기며 마무리됩니다. 집에서 요리를 재현할 수 있도록 레시피 카드가 제공됩니다.'
      }
    }
  },
  
  // Kuala Lumpur Activities
  {
    id: 'batu-caves-tour',
    cityId: 'kuala-lumpur',
    name: 'Batu Caves Temple Tour',
    lat: 3.2379,
    lng: 101.6841,
    radius: 80,
    narration: 'Climb the iconic 272 steps to the sacred Batu Caves Hindu temple. Marvel at the giant golden statue and explore limestone caverns filled with shrines.',
    description: 'Half-day tour to the famous Batu Caves temple complex',
    category: 'Activity',
    detailedDescription: 'Batu Caves is one of Malaysia\'s most iconic attractions, combining natural wonders with spiritual significance. The journey begins at the foot of the 140-foot golden statue of Lord Murugan, the largest of its kind in the world. Climb the famous rainbow-colored 272 steps (recently painted in vibrant hues) to reach the main Temple Cave, a massive limestone cavern over 100 meters high housing several Hindu shrines. The natural skylight creates a mystical atmosphere as sunbeams illuminate the cave interior. Explore the Dark Cave, a conservation site housing unique cave ecosystems, and Art Gallery Cave with its colorful Hindu dioramas. Watch for the cheeky macaque monkeys that inhabit the area. The tour includes transportation from Kuala Lumpur, a knowledgeable guide explaining Hindu traditions and cave formations, and time to experience the spiritual atmosphere.',
    photos: [
      'https://images.unsplash.com/photo-1549318228-1070e5b31c0a?w=800',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      'https://images.unsplash.com/photo-1583209343135-9848e8e9eb0d?w=800'
    ],
    translations: {
      en: {
        name: 'Batu Caves Temple Tour',
        narration: 'Climb the iconic 272 steps to the sacred Batu Caves Hindu temple. Marvel at the giant golden statue and explore limestone caverns filled with shrines.',
        description: 'Half-day tour to the famous Batu Caves temple complex',
        detailedDescription: 'Batu Caves is one of Malaysia\'s most iconic attractions, combining natural wonders with spiritual significance. The journey begins at the foot of the 140-foot golden statue of Lord Murugan, the largest of its kind in the world. Climb the famous rainbow-colored 272 steps (recently painted in vibrant hues) to reach the main Temple Cave, a massive limestone cavern over 100 meters high housing several Hindu shrines. The natural skylight creates a mystical atmosphere as sunbeams illuminate the cave interior. Explore the Dark Cave, a conservation site housing unique cave ecosystems, and Art Gallery Cave with its colorful Hindu dioramas. Watch for the cheeky macaque monkeys that inhabit the area. The tour includes transportation from Kuala Lumpur, a knowledgeable guide explaining Hindu traditions and cave formations, and time to experience the spiritual atmosphere.'
      },
      it: {
        name: 'Tour del Tempio delle Grotte di Batu',
        narration: 'Scala gli iconici 272 gradini fino al sacro tempio indù delle Grotte di Batu. Ammira la gigantesca statua dorata ed esplora caverne calcaree piene di santuari.',
        description: 'Tour di mezza giornata al famoso complesso del tempio delle Grotte di Batu',
        detailedDescription: 'Le Grotte di Batu sono una delle attrazioni più iconiche della Malesia, combinando meraviglie naturali con significato spirituale. Il viaggio inizia ai piedi della statua dorata di 43 metri di Lord Murugan, la più grande del suo genere al mondo. Scala i famosi 272 gradini color arcobaleno (recentemente dipinti in tonalità vivaci) per raggiungere la Grotta del Tempio principale, una massiccia caverna calcarea alta oltre 100 metri che ospita diversi santuari indù. Il lucernario naturale crea un\'atmosfera mistica mentre i raggi del sole illuminano l\'interno della grotta. Esplora la Grotta Oscura, un sito di conservazione che ospita ecosistemi cavernicoli unici, e la Grotta Galleria d\'Arte con i suoi colorati diorami indù. Attenzione alle birichine scimmie macaco che abitano l\'area. Il tour include trasporto da Kuala Lumpur, una guida esperta che spiega le tradizioni indù e le formazioni delle grotte, e tempo per sperimentare l\'atmosfera spirituale.'
      },
      ko: {
        name: '바투 동굴 사원 투어',
        narration: '신성한 바투 동굴 힌두 사원까지 상징적인 272개의 계단을 올라가세요. 거대한 황금 조각상을 감상하고 신전으로 가득 찬 석회암 동굴을 탐험하세요.',
        description: '유명한 바투 동굴 사원 단지로의 반나절 투어',
        detailedDescription: '바투 동굴은 자연의 경이로움과 영적 의미를 결합한 말레이시아에서 가장 상징적인 명소 중 하나입니다. 여정은 세계에서 가장 큰 규모인 43미터 높이의 무루간 신의 황금 조각상 아래에서 시작됩니다. 유명한 무지개색 272개 계단(최근 생생한 색조로 칠해짐)을 올라 높이 100미터가 넘는 거대한 석회암 동굴인 메인 사원 동굴에 도달하세요. 이곳에는 여러 힌두교 신전이 있습니다. 자연 채광창은 햇빛이 동굴 내부를 비추면서 신비로운 분위기를 만듭니다. 독특한 동굴 생태계를 보유한 보존 지역인 다크 케이브와 화려한 힌두교 디오라마가 있는 아트 갤러리 동굴을 탐험하세요. 이 지역에 서식하는 장난꾸러기 마카크 원숭이를 조심하세요. 투어에는 쿠알라룸푸르에서의 교통편, 힌두교 전통과 동굴 형성을 설명하는 지식 있는 가이드, 영적 분위기를 경험할 시간이 포함됩니다.'
      }
    }
  },
  {
    id: 'kl-food-street-tour',
    cityId: 'kuala-lumpur',
    name: 'Kuala Lumpur Street Food Tour',
    lat: 3.1478,
    lng: 101.6953,
    radius: 60,
    narration: 'Experience the incredible diversity of Malaysian street food on this evening walking tour. Taste Malay, Chinese, and Indian specialties at local favorites.',
    description: 'Evening street food walking tour in Kuala Lumpur',
    category: 'Activity',
    detailedDescription: 'Kuala Lumpur\'s street food scene is a delicious reflection of Malaysia\'s multicultural society. This evening food tour takes you off the tourist trail to authentic local eateries and street stalls where KL residents actually eat. Sample iconic dishes like nasi lemak (coconut rice with sambal), char kway teow (stir-fried noodles), roti canai with curry, satay (grilled meat skewers), cendol (shaved ice dessert), and durian (if you\'re brave!). Your local guide shares insights into Malaysian food culture, cooking techniques, and the history behind each dish. Visit bustling night markets like Jalan Alor or Petaling Street Chinatown, experience the energy of outdoor dining, and learn about the spices and ingredients that make Malaysian cuisine so distinctive. The tour includes 8-10 food tastings - enough for a full dinner.',
    photos: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'
    ],
    translations: {
      en: {
        name: 'Kuala Lumpur Street Food Tour',
        narration: 'Experience the incredible diversity of Malaysian street food on this evening walking tour. Taste Malay, Chinese, and Indian specialties at local favorites.',
        description: 'Evening street food walking tour in Kuala Lumpur',
        detailedDescription: 'Kuala Lumpur\'s street food scene is a delicious reflection of Malaysia\'s multicultural society. This evening food tour takes you off the tourist trail to authentic local eateries and street stalls where KL residents actually eat. Sample iconic dishes like nasi lemak (coconut rice with sambal), char kway teow (stir-fried noodles), roti canai with curry, satay (grilled meat skewers), cendol (shaved ice dessert), and durian (if you\'re brave!). Your local guide shares insights into Malaysian food culture, cooking techniques, and the history behind each dish. Visit bustling night markets like Jalan Alor or Petaling Street Chinatown, experience the energy of outdoor dining, and learn about the spices and ingredients that make Malaysian cuisine so distinctive. The tour includes 8-10 food tastings - enough for a full dinner.'
      },
      it: {
        name: 'Tour dello Street Food di Kuala Lumpur',
        narration: 'Sperimenta l\'incredibile diversità del cibo di strada malese in questo tour a piedi serale. Assaggia specialità malesi, cinesi e indiane nei locali preferiti.',
        description: 'Tour a piedi serale dello street food a Kuala Lumpur',
        detailedDescription: 'La scena dello street food di Kuala Lumpur è un delizioso riflesso della società multiculturale della Malesia. Questo tour gastronomico serale ti porta fuori dai sentieri turistici verso autentiche trattorie locali e bancarelle di strada dove i residenti di KL mangiano davvero. Assaggia piatti iconici come nasi lemak (riso al cocco con sambal), char kway teow (noodles saltati), roti canai con curry, satay (spiedini di carne alla griglia), cendol (dessert di ghiaccio tritato) e durian (se sei coraggioso!). La tua guida locale condivide approfondimenti sulla cultura gastronomica malese, tecniche di cucina e la storia dietro ogni piatto. Visita mercati notturni vivaci come Jalan Alor o Petaling Street Chinatown, sperimenta l\'energia della ristorazione all\'aperto e impara sulle spezie e ingredienti che rendono la cucina malese così distintiva. Il tour include 8-10 assaggi di cibo - abbastanza per una cena completa.'
      },
      ko: {
        name: '쿠알라룸푸르 스트리트 푸드 투어',
        narration: '이 저녁 도보 투어에서 말레이시아 길거리 음식의 놀라운 다양성을 경험하세요. 지역 인기 장소에서 말레이, 중국, 인도 특선 요리를 맛보세요.',
        description: '쿠알라룸푸르의 저녁 스트리트 푸드 도보 투어',
        detailedDescription: '쿠알라룸푸르의 스트리트 푸드 현장은 말레이시아 다문화 사회의 맛있는 반영입니다. 이 저녁 푸드 투어는 KL 주민들이 실제로 먹는 정통 지역 식당과 길거리 가판대로 관광 코스를 벗어나 안내합니다. 나시 르막(삼발을 곁들인 코코넛 밥), 차 콰이 티오(볶은 국수), 커리를 곁들인 로티 차나이, 사테(구운 고기 꼬치), 첸돌(빙수 디저트), 그리고 두리안(용감하다면!)과 같은 상징적인 요리를 맛보세요. 현지 가이드가 말레이시아 음식 문화, 요리 기술, 각 요리 뒤의 역사에 대한 통찰력을 공유합니다. 잘란 알로르나 페탈링 스트리트 차이나타운과 같은 번화한 야시장을 방문하고, 야외 식사의 에너지를 경험하고, 말레이시아 요리를 독특하게 만드는 향신료와 재료에 대해 배우세요. 투어에는 8-10가지 음식 시식이 포함되어 있습니다 - 완전한 저녁 식사에 충분합니다.'
      }
    }
  },
  {
    id: 'klcc-aquarium',
    cityId: 'kuala-lumpur',
    name: 'Aquaria KLCC Underwater Experience',
    lat: 3.1542,
    lng: 101.7123,
    radius: 50,
    narration: 'Journey through Aquaria KLCC, one of Southeast Asia\'s largest aquariums. Walk through a 90-meter underwater tunnel and see thousands of marine creatures.',
    description: 'Visit to Aquaria KLCC world-class oceanarium',
    category: 'Activity',
    detailedDescription: 'Aquaria KLCC offers an immersive journey through Malaysia\'s aquatic ecosystems and beyond. Located beneath the Kuala Lumpur Convention Centre, this state-of-the-art oceanarium showcases over 5,000 marine and land-bound creatures representing 150 species. The highlight is the spectacular 90-meter underwater tunnel where sharks, giant groupers, and rays glide overhead creating a surreal walking-on-the-ocean-floor experience. Explore diverse exhibits including Malaysian coral reefs, flooded rainforests, coastal waters, and deep ocean zones. Interactive touch pools let you feel starfish and sea cucumbers, while feeding sessions and dive shows provide educational entertainment. The aquarium\'s conservation message emphasizes protecting Malaysia\'s marine biodiversity. Climate-controlled and family-friendly, it\'s a perfect escape from KL\'s heat and humidity.',
    photos: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800'
    ],
    translations: {
      en: {
        name: 'Aquaria KLCC Underwater Experience',
        narration: 'Journey through Aquaria KLCC, one of Southeast Asia\'s largest aquariums. Walk through a 90-meter underwater tunnel and see thousands of marine creatures.',
        description: 'Visit to Aquaria KLCC world-class oceanarium',
        detailedDescription: 'Aquaria KLCC offers an immersive journey through Malaysia\'s aquatic ecosystems and beyond. Located beneath the Kuala Lumpur Convention Centre, this state-of-the-art oceanarium showcases over 5,000 marine and land-bound creatures representing 150 species. The highlight is the spectacular 90-meter underwater tunnel where sharks, giant groupers, and rays glide overhead creating a surreal walking-on-the-ocean-floor experience. Explore diverse exhibits including Malaysian coral reefs, flooded rainforests, coastal waters, and deep ocean zones. Interactive touch pools let you feel starfish and sea cucumbers, while feeding sessions and dive shows provide educational entertainment. The aquarium\'s conservation message emphasizes protecting Malaysia\'s marine biodiversity. Climate-controlled and family-friendly, it\'s a perfect escape from KL\'s heat and humidity.'
      },
      it: {
        name: 'Esperienza Subacquea Aquaria KLCC',
        narration: 'Viaggia attraverso Aquaria KLCC, uno dei più grandi acquari del Sud-Est asiatico. Cammina attraverso un tunnel sottomarino di 90 metri e vedi migliaia di creature marine.',
        description: 'Visita all\'oceanario di classe mondiale Aquaria KLCC',
        detailedDescription: 'Aquaria KLCC offre un viaggio immersivo attraverso gli ecosistemi acquatici della Malesia e oltre. Situato sotto il Kuala Lumpur Convention Centre, questo oceanario all\'avanguardia ospita oltre 5.000 creature marine e terrestri che rappresentano 150 specie. Il momento clou è il spettacolare tunnel sottomarino di 90 metri dove squali, cernie giganti e razze scivolano sopra la testa creando un\'esperienza surreale di camminata sul fondo dell\'oceano. Esplora mostre diverse tra cui barriere coralline malesi, foreste pluviali allagate, acque costiere e zone oceaniche profonde. Vasche tattili interattive ti permettono di toccare stelle marine e cetrioli di mare, mentre sessioni di alimentazione e spettacoli di immersione forniscono intrattenimento educativo. Il messaggio di conservazione dell\'acquario enfatizza la protezione della biodiversità marina della Malesia. Climatizzato e adatto alle famiglie, è una fuga perfetta dal caldo e dall\'umidità di KL.'
      },
      ko: {
        name: '아쿠아리아 KLCC 수중 체험',
        narration: '동남아시아에서 가장 큰 수족관 중 하나인 아쿠아리아 KLCC를 여행하세요. 90미터 수중 터널을 걸으며 수천 마리의 해양 생물을 보세요.',
        description: '세계적 수준의 아쿠아리아 KLCC 해양관 방문',
        detailedDescription: '아쿠아리아 KLCC는 말레이시아의 수생 생태계와 그 너머로의 몰입형 여행을 제공합니다. 쿠알라룸푸르 컨벤션 센터 아래에 위치한 이 최첨단 해양관은 150종을 대표하는 5,000마리 이상의 해양 및 육상 생물을 전시합니다. 하이라이트는 상어, 대형 농어, 가오리가 머리 위로 미끄러지며 해저를 걷는 듯한 초현실적인 경험을 만드는 90미터 수중 터널입니다. 말레이시아 산호초, 침수된 열대우림, 연안 해역, 심해 지역을 포함한 다양한 전시를 탐험하세요. 인터랙티브 터치 풀에서는 불가사리와 해삼을 만질 수 있고, 먹이 주기 세션과 다이빙 쇼는 교육적 오락을 제공합니다. 수족관의 보존 메시지는 말레이시아의 해양 생물 다양성 보호를 강조합니다. 에어컨이 설치되어 있고 가족 친화적이며 KL의 더위와 습도로부터의 완벽한 탈출구입니다.'
      }
    }
  },
  
  // Phuket Activities
  {
    id: 'phi-phi-island-tour',
    cityId: 'phuket',
    name: 'Phi Phi Islands Day Trip',
    lat: 7.7407,
    lng: 98.7784,
    radius: 100,
    narration: 'Explore the stunning Phi Phi Islands on this full-day boat tour. Snorkel in crystal-clear waters, visit Maya Bay, and relax on pristine beaches.',
    description: 'Full-day speedboat tour to Phi Phi Islands',
    category: 'Activity',
    detailedDescription: 'The Phi Phi Islands are among Thailand\'s most beautiful destinations, and this full-day tour showcases the best of this tropical paradise. Depart Phuket by speedboat and arrive at the iconic Phi Phi Islands, famous for their dramatic limestone cliffs rising from turquoise waters. Visit Maya Bay, made famous by the movie "The Beach," with its stunning crescent beach surrounded by towering cliffs. Snorkel at Pileh Lagoon where crystal-clear emerald waters are home to colorful tropical fish and coral gardens. Explore Viking Cave with its ancient wall paintings and bird nest harvesting operations. Enjoy a buffet lunch on Phi Phi Don, the larger inhabited island. The tour includes multiple snorkeling stops, beach time, photo opportunities, and all equipment. Hotel transfers and experienced guides ensure a safe, comfortable, and unforgettable island experience.',
    photos: [
      'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
    ],
    translations: {
      en: {
        name: 'Phi Phi Islands Day Trip',
        narration: 'Explore the stunning Phi Phi Islands on this full-day boat tour. Snorkel in crystal-clear waters, visit Maya Bay, and relax on pristine beaches.',
        description: 'Full-day speedboat tour to Phi Phi Islands',
        detailedDescription: 'The Phi Phi Islands are among Thailand\'s most beautiful destinations, and this full-day tour showcases the best of this tropical paradise. Depart Phuket by speedboat and arrive at the iconic Phi Phi Islands, famous for their dramatic limestone cliffs rising from turquoise waters. Visit Maya Bay, made famous by the movie "The Beach," with its stunning crescent beach surrounded by towering cliffs. Snorkel at Pileh Lagoon where crystal-clear emerald waters are home to colorful tropical fish and coral gardens. Explore Viking Cave with its ancient wall paintings and bird nest harvesting operations. Enjoy a buffet lunch on Phi Phi Don, the larger inhabited island. The tour includes multiple snorkeling stops, beach time, photo opportunities, and all equipment. Hotel transfers and experienced guides ensure a safe, comfortable, and unforgettable island experience.'
      },
      it: {
        name: 'Escursione Giornaliera alle Isole Phi Phi',
        narration: 'Esplora le splendide Isole Phi Phi in questo tour in barca di un\'intera giornata. Fai snorkeling in acque cristalline, visita Maya Bay e rilassati su spiagge incontaminate.',
        description: 'Tour in motoscafo di un\'intera giornata alle Isole Phi Phi',
        detailedDescription: 'Le Isole Phi Phi sono tra le destinazioni più belle della Thailandia, e questo tour di un\'intera giornata mostra il meglio di questo paradiso tropicale. Parti da Phuket in motoscafo e arriva alle iconiche Isole Phi Phi, famose per le loro drammatiche scogliere calcaree che emergono da acque turchesi. Visita Maya Bay, resa famosa dal film "The Beach", con la sua splendida spiaggia a mezzaluna circondata da scogliere torreggianti. Fai snorkeling a Pileh Lagoon dove acque smeraldo cristalline ospitano pesci tropicali colorati e giardini di corallo. Esplora la Viking Cave con le sue antiche pitture murali e operazioni di raccolta di nidi di uccelli. Goditi un pranzo a buffet su Phi Phi Don, l\'isola più grande e abitata. Il tour include molteplici soste per snorkeling, tempo in spiaggia, opportunità fotografiche e tutta l\'attrezzatura. Trasferimenti dall\'hotel e guide esperte garantiscono un\'esperienza isolana sicura, confortevole e indimenticabile.'
      },
      ko: {
        name: '피피 섬 당일 여행',
        narration: '이 하루 종일 보트 투어에서 멋진 피피 섬을 탐험하세요. 수정처럼 맑은 물에서 스노클링하고, 마야 베이를 방문하고, 깨끗한 해변에서 휴식하세요.',
        description: '피피 섬으로의 하루 종일 스피드보트 투어',
        detailedDescription: '피피 섬은 태국에서 가장 아름다운 목적지 중 하나이며, 이 하루 종일 투어는 이 열대 낙원의 최고를 선보입니다. 푸켓에서 스피드보트로 출발하여 청록색 바다에서 솟아오른 극적인 석회암 절벽으로 유명한 상징적인 피피 섬에 도착하세요. 영화 "더 비치"로 유명해진 마야 베이를 방문하세요. 우뚝 솟은 절벽으로 둘러싸인 멋진 초승달 모양의 해변이 있습니다. 수정처럼 맑은 에메랄드 빛 물이 형형색색의 열대어와 산호 정원의 서식지인 필레 라군에서 스노클링하세요. 고대 벽화와 새 둥지 채취 작업이 있는 바이킹 동굴을 탐험하세요. 더 큰 거주 섬인 피피 돈에서 뷔페 점심을 즐기세요. 투어에는 여러 스노클링 정류장, 해변 시간, 사진 촬영 기회, 모든 장비가 포함됩니다. 호텔 교통편과 숙련된 가이드가 안전하고 편안하며 잊을 수 없는 섬 경험을 보장합니다.'
      }
    }
  },
  {
    id: 'old-phuket-town-walk',
    cityId: 'phuket',
    name: 'Old Phuket Town Cultural Walk',
    lat: 7.8804,
    lng: 98.3923,
    radius: 60,
    narration: 'Discover the charm of Old Phuket Town on this walking tour. Explore colorful Sino-Portuguese architecture, visit local markets, and learn about Phuket\'s heritage.',
    description: 'Guided walking tour of historic Old Phuket Town',
    category: 'Activity',
    detailedDescription: 'Old Phuket Town is a treasure trove of history, culture, and architecture that most beach-goers miss. This walking tour explores the beautifully preserved Sino-Portuguese shophouses painted in vibrant colors - pink, yellow, mint green, and turquoise. Learn about Phuket\'s tin mining boom era when Chinese immigrants arrived and created this unique architectural blend. Visit historic buildings like the Thai Hua Museum, housed in a former Chinese school, and the Chinpracha House, a 100-year-old mansion. Explore Thalang Road\'s Sunday Walking Street market (if visiting Sunday) filled with local crafts, street food, and live performances. Discover hidden shrines, vintage cafes, contemporary art galleries, and street art. Your guide shares fascinating stories about Phuket\'s multicultural heritage, local legends, and the preservation efforts keeping this historic quarter alive. The tour includes stops at local food vendors for authentic Phuket snacks.',
    photos: [
      'https://images.unsplash.com/photo-1583209343135-9848e8e9eb0d?w=800',
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
      'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800'
    ],
    translations: {
      en: {
        name: 'Old Phuket Town Cultural Walk',
        narration: 'Discover the charm of Old Phuket Town on this walking tour. Explore colorful Sino-Portuguese architecture, visit local markets, and learn about Phuket\'s heritage.',
        description: 'Guided walking tour of historic Old Phuket Town',
        detailedDescription: 'Old Phuket Town is a treasure trove of history, culture, and architecture that most beach-goers miss. This walking tour explores the beautifully preserved Sino-Portuguese shophouses painted in vibrant colors - pink, yellow, mint green, and turquoise. Learn about Phuket\'s tin mining boom era when Chinese immigrants arrived and created this unique architectural blend. Visit historic buildings like the Thai Hua Museum, housed in a former Chinese school, and the Chinpracha House, a 100-year-old mansion. Explore Thalang Road\'s Sunday Walking Street market (if visiting Sunday) filled with local crafts, street food, and live performances. Discover hidden shrines, vintage cafes, contemporary art galleries, and street art. Your guide shares fascinating stories about Phuket\'s multicultural heritage, local legends, and the preservation efforts keeping this historic quarter alive. The tour includes stops at local food vendors for authentic Phuket snacks.'
      },
      it: {
        name: 'Passeggiata Culturale nella Vecchia Città di Phuket',
        narration: 'Scopri il fascino della Vecchia Città di Phuket in questo tour a piedi. Esplora l\'architettura colorata sino-portoghese, visita mercati locali e scopri il patrimonio di Phuket.',
        description: 'Tour a piedi guidato della storica Vecchia Città di Phuket',
        detailedDescription: 'La Vecchia Città di Phuket è un tesoro di storia, cultura e architettura che la maggior parte dei vacanzieri al mare si perde. Questo tour a piedi esplora le shophouse sino-portoghesi splendidamente conservate dipinte in colori vivaci - rosa, giallo, verde menta e turchese. Scopri l\'epoca del boom dello stagno di Phuket quando arrivarono immigrati cinesi e crearono questa miscela architettonica unica. Visita edifici storici come il Thai Hua Museum, ospitato in un\'ex scuola cinese, e la Chinpracha House, una dimora centenaria. Esplora il mercato della Thalang Road Sunday Walking Street (se visiti di domenica) pieno di artigianato locale, street food e spettacoli dal vivo. Scopri santuari nascosti, caffè vintage, gallerie d\'arte contemporanea e street art. La tua guida condivide storie affascinanti sul patrimonio multiculturale di Phuket, leggende locali e gli sforzi di conservazione che mantengono vivo questo quartiere storico. Il tour include soste presso venditori di cibo locali per autentici snack di Phuket.'
      },
      ko: {
        name: '올드 푸켓 타운 문화 산책',
        narration: '이 도보 투어에서 올드 푸켓 타운의 매력을 발견하세요. 화려한 중국-포르투갈 건축물을 탐험하고, 지역 시장을 방문하고, 푸켓의 유산에 대해 배우세요.',
        description: '역사적인 올드 푸켓 타운의 가이드 도보 투어',
        detailedDescription: '올드 푸켓 타운은 대부분의 해변 여행객들이 놓치는 역사, 문화, 건축의 보고입니다. 이 도보 투어는 분홍색, 노란색, 민트 그린, 청록색과 같은 생생한 색상으로 칠해진 아름답게 보존된 중국-포르투갈 샵하우스를 탐험합니다. 중국 이민자들이 도착하여 이 독특한 건축 혼합을 만든 푸켓의 주석 채굴 붐 시대에 대해 배우세요. 이전 중국 학교에 자리한 타이 후아 박물관과 100년 된 저택인 친프라차 하우스와 같은 역사적 건물을 방문하세요. 지역 공예품, 길거리 음식, 라이브 공연으로 가득한 탈랑 로드 일요일 워킹 스트리트 시장을 탐험하세요(일요일 방문 시). 숨겨진 신전, 빈티지 카페, 현대 미술관, 스트리트 아트를 발견하세요. 가이드가 푸켓의 다문화 유산, 지역 전설, 이 역사적인 지역을 살아있게 유지하는 보존 노력에 대한 매혹적인 이야기를 공유합니다. 투어에는 정통 푸켓 스낵을 위한 지역 음식 판매상 방문이 포함됩니다.'
      }
    }
  },
  {
    id: 'phuket-cooking-class',
    cityId: 'phuket',
    name: 'Thai Cooking Class Experience',
    lat: 7.8936,
    lng: 98.3969,
    radius: 50,
    narration: 'Master the art of Thai cuisine in this hands-on cooking class. Learn to prepare classic dishes using fresh local ingredients and traditional techniques.',
    description: 'Authentic Thai cooking class with market tour',
    category: 'Activity',
    detailedDescription: 'This immersive Thai cooking class offers much more than recipes - it\'s a cultural experience that reveals the heart of Thai cuisine. Begin with a guided tour of a local market where your instructor explains exotic ingredients like galangal, kaffir lime leaves, Thai basil varieties, and fish sauce grades. Learn to select the freshest produce and understand the importance of each ingredient. Return to a traditional Thai kitchen or outdoor cooking pavilion to prepare 4-5 classic dishes such as tom yum soup, pad thai, green curry, som tam (papaya salad), and mango sticky rice. Master essential techniques like pounding curry paste in a mortar, achieving the perfect balance of sweet, sour, salty, and spicy, and proper wok handling. The intimate class sizes ensure personalized attention. Enjoy your creations for lunch or dinner, and take home recipe cards and a certificate. Vegetarian and dietary modifications available.',
    photos: [
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
      'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800'
    ],
    translations: {
      en: {
        name: 'Thai Cooking Class Experience',
        narration: 'Master the art of Thai cuisine in this hands-on cooking class. Learn to prepare classic dishes using fresh local ingredients and traditional techniques.',
        description: 'Authentic Thai cooking class with market tour',
        detailedDescription: 'This immersive Thai cooking class offers much more than recipes - it\'s a cultural experience that reveals the heart of Thai cuisine. Begin with a guided tour of a local market where your instructor explains exotic ingredients like galangal, kaffir lime leaves, Thai basil varieties, and fish sauce grades. Learn to select the freshest produce and understand the importance of each ingredient. Return to a traditional Thai kitchen or outdoor cooking pavilion to prepare 4-5 classic dishes such as tom yum soup, pad thai, green curry, som tam (papaya salad), and mango sticky rice. Master essential techniques like pounding curry paste in a mortar, achieving the perfect balance of sweet, sour, salty, and spicy, and proper wok handling. The intimate class sizes ensure personalized attention. Enjoy your creations for lunch or dinner, and take home recipe cards and a certificate. Vegetarian and dietary modifications available.'
      },
      it: {
        name: 'Esperienza di Corso di Cucina Thailandese',
        narration: 'Padroneggia l\'arte della cucina thailandese in questo corso di cucina pratico. Impara a preparare piatti classici usando ingredienti locali freschi e tecniche tradizionali.',
        description: 'Autentico corso di cucina thailandese con tour del mercato',
        detailedDescription: 'Questo corso di cucina thailandese immersivo offre molto più che ricette - è un\'esperienza culturale che rivela il cuore della cucina thailandese. Inizia con un tour guidato di un mercato locale dove il tuo istruttore spiega ingredienti esotici come galangal, foglie di lime kaffir, varietà di basilico thailandese e gradi di salsa di pesce. Impara a selezionare i prodotti più freschi e comprendi l\'importanza di ogni ingrediente. Torna in una cucina thailandese tradizionale o padiglione di cucina all\'aperto per preparare 4-5 piatti classici come zuppa tom yum, pad thai, curry verde, som tam (insalata di papaya) e riso appiccicoso al mango. Padroneggia tecniche essenziali come pestare la pasta di curry in un mortaio, raggiungere il perfetto equilibrio di dolce, acido, salato e piccante e corretta gestione del wok. Le dimensioni intime delle classi garantiscono attenzione personalizzata. Goditi le tue creazioni a pranzo o cena e porta a casa schede ricette e un certificato. Modifiche vegetariane e dietetiche disponibili.'
      },
      ko: {
        name: '태국 요리 수업 체험',
        narration: '이 실습 요리 수업에서 태국 요리의 예술을 마스터하세요. 신선한 지역 재료와 전통 기술을 사용하여 고전 요리를 준비하는 방법을 배우세요.',
        description: '시장 투어가 포함된 정통 태국 요리 수업',
        detailedDescription: '이 몰입형 태국 요리 수업은 레시피 이상을 제공합니다 - 태국 요리의 핵심을 드러내는 문화 경험입니다. 강사가 갈랑갈, 카피르 라임 잎, 태국 바질 품종, 피시 소스 등급과 같은 이국적인 재료를 설명하는 지역 시장의 가이드 투어로 시작합니다. 가장 신선한 농산물을 선택하는 방법을 배우고 각 재료의 중요성을 이해하세요. 전통적인 태국 주방이나 야외 요리 파빌리온으로 돌아와 톰얌 수프, 팟타이, 그린 커리, 솜탐(파파야 샐러드), 망고 스티키 라이스와 같은 4-5가지 고전 요리를 준비합니다. 절구에서 커리 페이스트를 찧는 것, 단맛, 신맛, 짠맛, 매운맛의 완벽한 균형을 이루는 것, 적절한 웍 다루기와 같은 필수 기술을 마스터하세요. 소규모 수업 규모는 개인별 관심을 보장합니다. 점심이나 저녁으로 여러분의 창작물을 즐기고, 레시피 카드와 수료증을 가져가세요. 채식 및 식이 조절이 가능합니다.'
      }
    }
  }
];

export class MemStorage implements IStorage {
  async getCities(): Promise<City[]> {
    return CITIES;
  }

  async getCity(id: string): Promise<City | undefined> {
    return CITIES.find(city => city.id === id);
  }

  async getLandmarks(cityId?: string): Promise<Landmark[]> {
    const allLandmarks = [...LANDMARKS, ...RESTAURANTS];
    if (cityId) {
      return allLandmarks.filter(landmark => landmark.cityId === cityId);
    }
    return allLandmarks;
  }

  async getLandmark(id: string): Promise<Landmark | undefined> {
    const allLandmarks = [...LANDMARKS, ...RESTAURANTS];
    return allLandmarks.find(landmark => landmark.id === id);
  }

  // Visited landmarks methods - using database
  async markLandmarkVisited(landmarkId: string, sessionId?: string): Promise<VisitedLandmark> {
    // Use ON CONFLICT DO NOTHING to prevent duplicate visits
    const [visited] = await db
      .insert(visitedLandmarks)
      .values({ landmarkId, sessionId })
      .onConflictDoNothing()
      .returning();
    
    // If no row returned (duplicate), fetch the existing one
    if (!visited) {
      const conditions = sessionId 
        ? and(eq(visitedLandmarks.landmarkId, landmarkId), eq(visitedLandmarks.sessionId, sessionId))
        : eq(visitedLandmarks.landmarkId, landmarkId);
      
      const [existing] = await db
        .select()
        .from(visitedLandmarks)
        .where(conditions!);
      return existing;
    }
    
    return visited;
  }

  async getVisitedLandmarks(sessionId?: string): Promise<VisitedLandmark[]> {
    if (sessionId) {
      return await db
        .select()
        .from(visitedLandmarks)
        .where(eq(visitedLandmarks.sessionId, sessionId));
    }
    return await db.select().from(visitedLandmarks);
  }

  async isLandmarkVisited(landmarkId: string, sessionId?: string): Promise<boolean> {
    const conditions = sessionId
      ? and(eq(visitedLandmarks.landmarkId, landmarkId), eq(visitedLandmarks.sessionId, sessionId))
      : eq(visitedLandmarks.landmarkId, landmarkId);
    
    const results = await db
      .select()
      .from(visitedLandmarks)
      .where(conditions!);
    
    return results.length > 0;
  }

  async getVisitedCount(sessionId?: string): Promise<number> {
    if (sessionId) {
      const result = await db
        .select({ count: count() })
        .from(visitedLandmarks)
        .where(eq(visitedLandmarks.sessionId, sessionId));
      return result[0]?.count || 0;
    }
    
    const result = await db
      .select({ count: count() })
      .from(visitedLandmarks);
    return result[0]?.count || 0;
  }

  // Audio methods - using database
  async getAudio(landmarkId: string, language: string): Promise<LandmarkAudio | undefined> {
    const [audio] = await db
      .select()
      .from(landmarkAudioTable)
      .where(and(
        eq(landmarkAudioTable.landmarkId, landmarkId),
        eq(landmarkAudioTable.language, language)
      ));
    return audio;
  }

  async getAudioByCity(cityId: string): Promise<LandmarkAudio[]> {
    const landmarks = await this.getLandmarks(cityId);
    const landmarkIds = landmarks.map(l => l.id);
    
    if (landmarkIds.length === 0) return [];
    
    const audioList = await db
      .select()
      .from(landmarkAudioTable)
      .where(sql`${landmarkAudioTable.landmarkId} = ANY(${landmarkIds})`);
    
    return audioList;
  }

  async saveAudio(audio: InsertLandmarkAudio): Promise<LandmarkAudio> {
    const [saved] = await db
      .insert(landmarkAudioTable)
      .values(audio)
      .onConflictDoUpdate({
        target: [landmarkAudioTable.landmarkId, landmarkAudioTable.language],
        set: {
          audioUrl: audio.audioUrl,
          duration: audio.duration,
          sizeBytes: audio.sizeBytes,
          checksum: audio.checksum,
          voiceId: audio.voiceId,
          updatedAt: new Date()
        }
      })
      .returning();
    return saved;
  }

  async deleteAudio(landmarkId: string, language: string): Promise<void> {
    await db
      .delete(landmarkAudioTable)
      .where(and(
        eq(landmarkAudioTable.landmarkId, landmarkId),
        eq(landmarkAudioTable.language, language)
      ));
  }
}

export const storage = new MemStorage();
