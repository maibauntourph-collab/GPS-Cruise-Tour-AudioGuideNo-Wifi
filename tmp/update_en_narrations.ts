import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

const narrations: Record<string, string> = {
  'kr-seoul-gyeongbokgung': `Welcome to Gyeongbokgung, the grandest of Seoul's five royal palaces and the beating heart of the Joseon Dynasty. Built in 1395, this sprawling complex housed kings and queens for over five centuries. Stand before Gwanghwamun Gate and feel the weight of history. Every day, guards in vivid crimson and blue perform the Royal Guard Changing Ceremony, a spectacle like stepping into a living painting. Here is a tip locals love: wear a hanbok and your entry is completely free. Rental shops surround the palace, so grab one and wander the courtyards like royalty.`,

  'kr-seoul-n-tower': `Rising above the forested slopes of Namsan Mountain, N Seoul Tower is the city's most beloved landmark. Since 1980, couples have fastened love locks to the railings here, each one a tiny metallic promise glinting in the sunlight. The observation deck reveals the Han River snaking through endless neighborhoods, with mountains framing the horizon in every direction. Take the Namsan Cable Car for a ride through the treetops, especially magical after sunset when ten million city lights flicker to life below. Grab a window seat at the revolving restaurant and let Seoul spin around your plate.`,

  'kr-seoul-bukchon': `Nestled between two grand palaces, Bukchon Hanok Village is a living neighborhood where six hundred years of Korean tradition meet modern Seoul. Narrow alleyways wind past hundreds of traditional hanok houses with gracefully curved tile roofs and stone courtyards from the Joseon era. Walk slowly and listen: you might hear a calligraphy brush or smell sesame oil from a kitchen window. Every turn rewards you with surprise views of distant palace rooftops or Namsan Tower. Visit early morning before the crowds, and remember, real families live here, so keep your voice low and curiosity high.`,

  'kr-seoul-myeongdong': `Step into Myeongdong and your senses go into overdrive. This legendary shopping district is a neon-lit canyon of K-beauty stores, fashion boutiques, and street food vendors calling from every corner. Follow the smell of hotteok, crispy pancakes filled with melted brown sugar, or try a tornado potato spiraling on a stick. Between the shops you will find Myeongdong Cathedral, a stunning Gothic church from 1898 that holds its own against the commercial frenzy. Come hungry, bring an empty suitcase for all the skincare you will buy, and let the crowd carry you through one of Asia's most electrifying retail experiences.`,

  'kr-seoul-gwangjang-market': `Gwangjang Market is where Seoul gets real. Opened in 1905, it is Korea's first permanent market, and stepping inside feels like being swallowed by a delicious, noisy, wonderful beast. Find a stool at a tiny food stall and point at whatever your neighbor is eating. Chances are it will be bindaetteok, a crispy mung bean pancake fried golden before your eyes, or mayak gimbap, tiny rice rolls so addictive they earned the nickname narcotic gimbap. Ajummas work with hands that have flipped a million pancakes, and the sizzle around you is the authentic soundtrack of Korean life. Come hungry and let the market grandmothers feed you.`,

  'kr-seoul-lotte-world': `Lotte World holds a Guinness World Record as the largest indoor theme park on the planet, a candy-colored wonderland beneath a massive glass dome in the heart of Seoul. Roller coasters loop overhead, parades float past every afternoon, and an ice skating rink gleams at the center. Step outside to Magic Island, a fairy-tale castle on Seokchon Lake with outdoor rides offering skyline views between the thrills. Rain or shine, Lotte World delivers pure joy regardless of the weather. Buy tickets online to skip the queues, and budget a full day because you will not want to leave.`,

  'kr-seoul-the-hyundai': `The Hyundai Seoul is not your typical department store. Opened in 2021 on Yeouido, it drew over a hundred million visitors in its first two years. The showstopper is Sounds Forest, a massive indoor garden on the fifth floor where real trees grow beneath a glass ceiling and birdsong plays through hidden speakers. It feels like escaping into a park without leaving the building. The basement food hall is a curated wonderland of trending restaurants, artisan bakeries, and popup dessert shops that change with the seasons. This is where young Seoul comes to see and be seen, so bring your appetite.`,

  'kr-seoul-seongsu': `They call Seongsu-dong the Brooklyn of Seoul, and honestly, the comparison fits. This former industrial neighborhood of shoe factories and warehouses has been transformed into the city's coolest district. Converted factories now house specialty coffee roasters with exposed brick and soaring ceilings, while popup stores appear and vanish like fashionable ghosts every few weeks. The cafe culture here is extraordinary, with each shop competing to outdo the last. Walk the streets and you will pass concept stores, indie boutiques, and galleries that smell like fresh paint and ambition. Come on a weekday to beat the crowds.`,

  'kr-global-olive-young': `Olive Young in Myeongdong is the mothership of K-beauty, a glowing temple of skincare and makeup that draws beauty pilgrims from every corner of the globe. This flagship store is stacked with thousands of Korean beauty brands the rest of the world is just discovering. Sheet masks, serums, sunscreens, lip tints: the selection is overwhelming in the best way. Staff speak multiple languages and guide you to trending products, from snail mucin essences to rice water toners. Tax-free shopping is available for tourists, so bring your passport. Prices are often half of what you pay abroad, so stock up without guilt.`,

  'kr-seoul-london-bagel': `London Bagel Museum is proof that Seoul takes its food obsessions very seriously. This tiny bakery regularly draws lines of two to three hours, and people keep coming back. The concept blends British baking with Korean creativity, producing bagels with fillings like cream cheese and fig, earl grey custard, and seasonal specials that change without warning. The interior is pure vintage charm with antique furniture and warm wood tones. Arrive thirty minutes before opening on a weekday, grab a number, and explore nearby cafes while you wait. When you bite into that perfectly chewy, still-warm bagel, you will understand the hype.`,

  'kr-seoul-myeongdong-gyoja': `Since 1966, Myeongdong Kyoja has been doing one thing better than almost anyone in Seoul: kalguksu, handmade knife-cut noodles in a rich, milky broth that warms you from the inside out. The Michelin Guide awarded it a Bib Gourmand for exceptional food at a modest price, and locals have given it their loyalty for nearly sixty years. Watch the ajummas rolling and slicing dough by hand with astonishing speed, each strand landing in the bubbling pot with practiced precision. The menu is short, the tables are shared, and the experience is pure Korean soul food. Come at eleven thirty before the lunch rush. One bowl is never enough.`,

  'kr-busan-haeundae': `Haeundae Beach is where Korea comes to breathe. This legendary crescent of sand stretches along Busan's coastline as the country's number one beach, built on decades of summer memories, film festivals, and spectacular seafood. During the Busan International Film Festival, nearby streets transform into a red-carpet wonderland. Walk east to Dongbaek Island, a lush wooded cape where camellias bloom in winter and ocean views are staggering. The raw fish markets serve sashimi so fresh it practically introduces itself. Visit in autumn when crowds thin, the water holds its warmth, and sunsets paint the sky tangerine and gold.`,

  'kr-jeju-seongsan': `Seongsan Ilchulbong, the Sunrise Peak, is a five-thousand-year-old volcanic crater rising from the sea like a giant stone crown on eastern Jeju Island. UNESCO recognized this dramatic tuff cone as a World Heritage site, and one look at its jagged rim against the dawn sky tells you why. The hike takes about twenty-five minutes up a well-maintained stairway, and at the top awaits a vast bowl-shaped crater carpeted in wild grass with ocean stretching endlessly around you. Arrive before sunrise for the full experience: watching the sun crack the horizon from this ancient rim is one of Korea's most breathtaking moments. Wear layers, the wind up top is fierce.`
};

async function main() {
  console.log('=== Updating English narrations for 13 Korean landmarks ===\n');

  let updated = 0;
  let errors = 0;

  for (const [id, enNarration] of Object.entries(narrations)) {
    try {
      // First, fetch existing narration_i18n
      const rows = await sql`
        SELECT id, name, narration_i18n FROM landmarks WHERE id = ${id}
      `;

      if (rows.length === 0) {
        console.log(`[SKIP] ${id} - not found in database`);
        errors++;
        continue;
      }

      const row = rows[0];
      const existing = (row.narration_i18n as Record<string, string>) || {};
      const newI18n = { ...existing, en: enNarration };

      await sql`
        UPDATE landmarks
        SET narration_i18n = ${JSON.stringify(newI18n)}::jsonb,
            updated_at = NOW()
        WHERE id = ${id}
      `;

      console.log(`[OK] ${id} (${row.name}) - en: ${enNarration.length} chars | keys: ${Object.keys(newI18n).join(', ')}`);
      updated++;
    } catch (err) {
      console.error(`[ERROR] ${id}: ${err}`);
      errors++;
    }
  }

  console.log(`\n=== Done: ${updated} updated, ${errors} errors ===`);

  // Verify
  console.log('\n=== Verification ===');
  const ids = Object.keys(narrations);
  for (const id of ids) {
    const rows = await sql`
      SELECT id, narration_i18n FROM landmarks WHERE id = ${id}
    `;
    if (rows.length > 0) {
      const i18n = rows[0].narration_i18n as Record<string, string>;
      const enLen = i18n?.en?.length || 0;
      const koLen = i18n?.ko?.length || 0;
      const keys = Object.keys(i18n || {}).join(', ');
      console.log(`  ${id}: keys=[${keys}] en=${enLen}c ko=${koLen}c`);
    }
  }
}

main().catch(console.error);
