import { initializeDatabase, execute, queryAll, queryOne } from './db';
import { v4 as uuid } from 'uuid';

/**
 * Migration script: adds more KS2 vocabulary to each world
 * without resetting the database or losing progress.
 * Run: npx ts-node src/database/add-words.ts
 */

interface World {
  id: string;
  name: string;
  theme: string;
}

interface WordEntry {
  word: string;
  definition: string;
  pos: string;
  tier: number;
  example: string;
  category: string;
}

async function addWords() {
  console.log('Connecting to database...');
  await initializeDatabase();

  // Get existing worlds
  const worlds = queryAll<World>('SELECT id, name, theme FROM worlds ORDER BY display_order');
  if (worlds.length === 0) {
    console.error('No worlds found — run the seed first.');
    return;
  }

  const worldByTheme: Record<string, string> = {};
  worlds.forEach(w => {
    worldByTheme[w.theme] = w.id;
    console.log(`  Found world: ${w.name} (${w.theme})`);
  });

  // Check which words already exist so we don't duplicate
  const existingWords = new Set(
    queryAll<{ word: string }>('SELECT word FROM vocabulary').map(v => v.word.toLowerCase())
  );
  console.log(`  Existing vocabulary: ${existingWords.size} words`);

  let added = 0;

  const insertWord = (entry: WordEntry, worldId: string) => {
    if (existingWords.has(entry.word.toLowerCase())) return;
    execute(
      `INSERT INTO vocabulary (id, word, definition, part_of_speech, difficulty_tier, example_sentence, category, world_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), entry.word, entry.definition, entry.pos, entry.tier, entry.example, entry.category, worldId]
    );
    existingWords.add(entry.word.toLowerCase());
    added++;
  };

  // ============================================================
  // SUNBEAM MEADOWS — Light, warmth, fire, colour
  // ============================================================
  const sunId = worldByTheme['sun'];
  if (sunId) {
    const sunWords: WordEntry[] = [
      { word: 'radiant', definition: 'sending out light; shining brightly', pos: 'adjective', tier: 2, example: 'Her radiant smile lit up the room', category: 'sun_light' },
      { word: 'luminous', definition: 'giving off light; bright', pos: 'adjective', tier: 3, example: 'The luminous moon lit the garden', category: 'sun_light' },
      { word: 'brilliant', definition: 'very bright and sparkling', pos: 'adjective', tier: 2, example: 'Brilliant sunshine flooded the valley', category: 'sun_light' },
      { word: 'glowing', definition: 'giving out a steady light or heat', pos: 'adjective', tier: 1, example: 'The glowing embers kept us warm', category: 'sun_light' },
      { word: 'vibrant', definition: 'bright and full of energy', pos: 'adjective', tier: 2, example: 'Vibrant colours filled the garden', category: 'sun_light' },
      { word: 'blazing', definition: 'burning or shining very brightly', pos: 'adjective', tier: 2, example: 'The blazing fire crackled and popped', category: 'sun_light' },
      { word: 'dim', definition: 'not bright; faint', pos: 'adjective', tier: 1, example: 'A dim light flickered in the window', category: 'sun_light' },
      { word: 'faded', definition: 'having lost colour or brightness', pos: 'adjective', tier: 1, example: 'The faded curtains needed replacing', category: 'sun_light' },
      { word: 'crimson', definition: 'a rich, deep red colour', pos: 'adjective', tier: 3, example: 'The crimson sunset was breathtaking', category: 'sun_light' },
      { word: 'amber', definition: 'a warm honey-yellow colour', pos: 'adjective', tier: 2, example: 'Amber light poured through the leaves', category: 'sun_light' },
      { word: 'scarlet', definition: 'a brilliant red colour', pos: 'adjective', tier: 2, example: 'Scarlet berries dotted the bush', category: 'sun_light' },
      { word: 'illuminate', definition: 'to light up; to make bright', pos: 'verb', tier: 3, example: 'Candles illuminated the dark room', category: 'sun_light' },
      { word: 'glow', definition: 'to give out a steady light without flame', pos: 'verb', tier: 1, example: 'The fireflies glowed in the dark', category: 'sun_light' },
      { word: 'flicker', definition: 'to shine with an unsteady light', pos: 'verb', tier: 2, example: 'The candle flickered in the breeze', category: 'sun_light' },
      { word: 'ignite', definition: 'to catch fire or set alight', pos: 'verb', tier: 3, example: 'A spark ignited the dry leaves', category: 'sun_light' },
    ];
    sunWords.forEach(w => insertWord(w, sunId));
  }

  // ============================================================
  // STORMCLOUD HEIGHTS — Weather, storms, temperature
  // ============================================================
  const weatherId = worldByTheme['weather'];
  if (weatherId) {
    const weatherWords: WordEntry[] = [
      { word: 'tempest', definition: 'a violent, windy storm', pos: 'noun', tier: 4, example: 'The tempest raged for three days', category: 'rain' },
      { word: 'drizzle', definition: 'light, fine rain', pos: 'noun', tier: 1, example: 'A light drizzle began to fall', category: 'rain' },
      { word: 'blizzard', definition: 'a severe snowstorm with strong winds', pos: 'noun', tier: 3, example: 'The blizzard trapped them indoors', category: 'rain' },
      { word: 'downpour', definition: 'a very heavy fall of rain', pos: 'noun', tier: 2, example: 'We were soaked by the sudden downpour', category: 'rain' },
      { word: 'sleet', definition: 'a mixture of rain and snow', pos: 'noun', tier: 2, example: 'Cold sleet stung their cheeks', category: 'rain' },
      { word: 'thunder', definition: 'a loud rumbling sound during a storm', pos: 'noun', tier: 1, example: 'Thunder shook the old house', category: 'rain' },
      { word: 'lightning', definition: 'a flash of bright light in the sky during a storm', pos: 'noun', tier: 1, example: 'Lightning lit up the night sky', category: 'rain' },
      { word: 'hail', definition: 'small balls of ice that fall like rain', pos: 'noun', tier: 2, example: 'Hail bounced off the car roof', category: 'rain' },
      { word: 'frost', definition: 'a thin layer of ice on surfaces', pos: 'noun', tier: 1, example: 'Frost covered the grass each morning', category: 'clouds' },
      { word: 'overcast', definition: 'cloudy; with the sky covered by clouds', pos: 'adjective', tier: 2, example: 'The overcast sky threatened rain', category: 'clouds' },
      { word: 'muggy', definition: 'warm and damp; uncomfortably humid', pos: 'adjective', tier: 3, example: 'The muggy afternoon made everyone sluggish', category: 'wind' },
      { word: 'gust', definition: 'a sudden strong rush of wind', pos: 'noun', tier: 2, example: 'A gust of wind snatched her hat', category: 'wind' },
      { word: 'breeze', definition: 'a gentle wind', pos: 'noun', tier: 1, example: 'A cool breeze blew off the sea', category: 'wind' },
      { word: 'howled', definition: 'made a long, loud crying sound', pos: 'verb', tier: 2, example: 'The wind howled through the valley', category: 'wind' },
      { word: 'drenched', definition: 'completely soaked with water', pos: 'adjective', tier: 2, example: 'We were drenched after the storm', category: 'rain' },
      { word: 'sweltering', definition: 'uncomfortably hot', pos: 'adjective', tier: 3, example: 'It was a sweltering summer afternoon', category: 'clouds' },
      { word: 'crisp', definition: 'cool and fresh', pos: 'adjective', tier: 1, example: 'The crisp autumn air felt refreshing', category: 'wind' },
      { word: 'blustery', definition: 'blowing in strong gusts', pos: 'adjective', tier: 3, example: 'A blustery day sent leaves swirling', category: 'wind' },
    ];
    weatherWords.forEach(w => insertWord(w, weatherId));
  }

  // ============================================================
  // CORAL KINGDOM — Ocean, beach, underwater
  // ============================================================
  const seaId = worldByTheme['beach_sea'];
  if (seaId) {
    const seaWords: WordEntry[] = [
      { word: 'shallow', definition: 'not deep', pos: 'adjective', tier: 1, example: 'Children paddled in the shallow water', category: 'beach_sea' },
      { word: 'crystal-clear', definition: 'completely transparent', pos: 'adjective', tier: 2, example: 'The crystal-clear lagoon was stunning', category: 'beach_sea' },
      { word: 'foamy', definition: 'covered with or producing foam', pos: 'adjective', tier: 1, example: 'Foamy waves rolled onto the sand', category: 'beach_sea' },
      { word: 'glistening', definition: 'shining with a sparkling light', pos: 'adjective', tier: 2, example: 'Glistening shells dotted the beach', category: 'beach_sea' },
      { word: 'tropical', definition: 'from or typical of the tropics; very hot', pos: 'adjective', tier: 2, example: 'Tropical fish darted through the coral', category: 'beach_sea' },
      { word: 'reef', definition: 'a ridge of rock or coral near the surface of the sea', pos: 'noun', tier: 2, example: 'The coral reef was full of colourful fish', category: 'beach_sea' },
      { word: 'horizon', definition: 'the line where the earth and sky appear to meet', pos: 'noun', tier: 2, example: 'The sun sank below the horizon', category: 'beach_sea' },
      { word: 'tide', definition: 'the regular rise and fall of the sea', pos: 'noun', tier: 1, example: 'The tide came in and covered the rocks', category: 'beach_sea' },
      { word: 'shore', definition: 'the land along the edge of the sea', pos: 'noun', tier: 1, example: 'Waves washed shells onto the shore', category: 'beach_sea' },
      { word: 'driftwood', definition: 'wood floating on or washed ashore by the sea', pos: 'noun', tier: 2, example: 'We built a fire from driftwood', category: 'beach_sea' },
      { word: 'barnacle', definition: 'a small shellfish that sticks to rocks and boats', pos: 'noun', tier: 3, example: 'Barnacles covered the bottom of the boat', category: 'beach_sea' },
      { word: 'anchored', definition: 'held firmly in place', pos: 'verb', tier: 2, example: 'The boat was anchored in the bay', category: 'beach_sea' },
      { word: 'dived', definition: 'plunged headfirst into water', pos: 'verb', tier: 1, example: 'She dived into the sparkling pool', category: 'beach_sea' },
      { word: 'glide', definition: 'to move smoothly and quietly', pos: 'verb', tier: 2, example: 'Dolphins glide through the waves', category: 'beach_sea' },
      { word: 'swell', definition: 'to rise in size or amount', pos: 'verb', tier: 2, example: 'The ocean began to swell before the storm', category: 'beach_sea' },
    ];
    seaWords.forEach(w => insertWord(w, seaId));
  }

  // ============================================================
  // WHISPERING WOODS — Forest, nature, animals
  // ============================================================
  const forestId = worldByTheme['forest'];
  if (forestId) {
    const forestWords: WordEntry[] = [
      { word: 'mossy', definition: 'covered with moss', pos: 'adjective', tier: 1, example: 'Mossy stones lined the stream', category: 'forest' },
      { word: 'tangled', definition: 'twisted together in a messy way', pos: 'adjective', tier: 2, example: 'Tangled roots crossed the path', category: 'forest' },
      { word: 'mysterious', definition: 'difficult to understand; full of mystery', pos: 'adjective', tier: 2, example: 'The mysterious forest was full of sounds', category: 'forest' },
      { word: 'enchanted', definition: 'placed under a magical spell', pos: 'adjective', tier: 2, example: 'The enchanted grove glowed at night', category: 'forest' },
      { word: 'overgrown', definition: 'covered with plants that have grown too much', pos: 'adjective', tier: 2, example: 'The overgrown path was hard to follow', category: 'forest' },
      { word: 'hollow', definition: 'having an empty space inside', pos: 'adjective', tier: 2, example: 'An owl lived in the hollow tree', category: 'forest' },
      { word: 'bark', definition: 'the tough outer covering of a tree', pos: 'noun', tier: 1, example: 'She traced the rough bark with her fingers', category: 'forest' },
      { word: 'clearing', definition: 'an open space in a forest', pos: 'noun', tier: 2, example: 'Sunlight filled the small clearing', category: 'forest' },
      { word: 'burrow', definition: 'a hole or tunnel dug by an animal', pos: 'noun', tier: 2, example: 'The rabbit disappeared into its burrow', category: 'forest' },
      { word: 'habitat', definition: 'the natural home of an animal or plant', pos: 'noun', tier: 2, example: 'The forest is a habitat for many creatures', category: 'forest' },
      { word: 'predator', definition: 'an animal that hunts other animals for food', pos: 'noun', tier: 3, example: 'The fox is a clever predator', category: 'forest' },
      { word: 'prey', definition: 'an animal hunted by another for food', pos: 'noun', tier: 3, example: 'The mouse became prey for the owl', category: 'forest' },
      { word: 'nocturnal', definition: 'active during the night', pos: 'adjective', tier: 3, example: 'Owls are nocturnal birds', category: 'forest' },
      { word: 'camouflage', definition: 'colours or patterns that help an animal hide', pos: 'noun', tier: 3, example: 'The frog used camouflage to blend in', category: 'forest' },
      { word: 'hibernate', definition: 'to spend the winter in a deep sleep', pos: 'verb', tier: 3, example: 'Bears hibernate through the cold months', category: 'forest' },
      { word: 'sprout', definition: 'to begin to grow', pos: 'verb', tier: 1, example: 'New leaves sprouted in spring', category: 'forest' },
      { word: 'decay', definition: 'to rot or break down naturally', pos: 'verb', tier: 3, example: 'Fallen leaves decay on the forest floor', category: 'forest' },
      { word: 'thrive', definition: 'to grow and develop well', pos: 'verb', tier: 3, example: 'Wildflowers thrive in the meadow', category: 'forest' },
    ];
    forestWords.forEach(w => insertWord(w, forestId));
  }

  // ============================================================
  // PORTRAIT GALLERY — Appearance, emotions, personality
  // ============================================================
  const appearanceId = worldByTheme['appearance'];
  if (appearanceId) {
    const appearanceWords: WordEntry[] = [
      // Face & Features
      { word: 'freckled', definition: 'having small brown spots on the skin', pos: 'adjective', tier: 1, example: 'Her freckled cheeks turned pink', category: 'hair' },
      { word: 'rosy', definition: 'pink and healthy-looking', pos: 'adjective', tier: 1, example: 'His rosy cheeks showed he had been running', category: 'hair' },
      { word: 'pale', definition: 'light in colour; not dark', pos: 'adjective', tier: 1, example: 'She looked pale with worry', category: 'hair' },
      { word: 'tanned', definition: 'having darker skin from the sun', pos: 'adjective', tier: 1, example: 'His tanned arms showed he loved the outdoors', category: 'hair' },
      { word: 'wrinkled', definition: 'having small lines or folds', pos: 'adjective', tier: 2, example: 'Grandma had wrinkled but kind hands', category: 'hair' },
      // Emotions on face
      { word: 'beaming', definition: 'smiling very broadly with happiness', pos: 'adjective', tier: 1, example: 'She had a beaming smile on her face', category: 'eyes' },
      { word: 'scowling', definition: 'frowning in an angry or bad-tempered way', pos: 'adjective', tier: 2, example: 'The scowling man crossed his arms', category: 'eyes' },
      { word: 'bewildered', definition: 'very confused and puzzled', pos: 'adjective', tier: 3, example: 'He looked bewildered by the surprise', category: 'eyes' },
      { word: 'grimaced', definition: 'made an ugly, twisted face expression', pos: 'verb', tier: 3, example: 'She grimaced at the sour taste', category: 'eyes' },
      { word: 'peered', definition: 'looked closely or with difficulty', pos: 'verb', tier: 2, example: 'He peered through the foggy window', category: 'eyes' },
      { word: 'gazed', definition: 'looked steadily for a long time', pos: 'verb', tier: 2, example: 'She gazed at the stars above', category: 'eyes' },
      { word: 'glanced', definition: 'looked quickly', pos: 'verb', tier: 1, example: 'He glanced at his watch and hurried on', category: 'eyes' },
      { word: 'winced', definition: 'made a quick expression of pain', pos: 'verb', tier: 3, example: 'She winced when the door slammed', category: 'eyes' },
      // Personality / character description
      { word: 'generous', definition: 'willing to give and share freely', pos: 'adjective', tier: 2, example: 'She was generous with her sweets', category: 'hair' },
      { word: 'courageous', definition: 'brave; not afraid of danger', pos: 'adjective', tier: 3, example: 'The courageous firefighter saved the cat', category: 'hair' },
      { word: 'cunning', definition: 'clever in a sneaky or tricky way', pos: 'adjective', tier: 3, example: 'The cunning fox tricked the crow', category: 'hair' },
      { word: 'stubborn', definition: 'refusing to change one\'s mind', pos: 'adjective', tier: 2, example: 'The stubborn donkey would not move', category: 'hair' },
      { word: 'timid', definition: 'easily frightened; shy', pos: 'adjective', tier: 2, example: 'The timid rabbit froze at the noise', category: 'eyes' },
    ];
    appearanceWords.forEach(w => insertWord(w, appearanceId));
  }

  // ============================================================
  // ADVENTURE TRAIL — Movement, actions, feelings
  // ============================================================
  const movementId = worldByTheme['movement'];
  if (movementId) {
    const movementWords: WordEntry[] = [
      // More movement verbs
      { word: 'stumbled', definition: 'tripped or nearly fell while walking', pos: 'verb', tier: 2, example: 'She stumbled over the loose stone', category: 'movement' },
      { word: 'leaped', definition: 'jumped a long way or high', pos: 'verb', tier: 1, example: 'The deer leaped over the fence', category: 'movement' },
      { word: 'sprinted', definition: 'ran at full speed for a short distance', pos: 'verb', tier: 2, example: 'He sprinted to the finish line', category: 'movement' },
      { word: 'crept', definition: 'moved slowly and quietly', pos: 'verb', tier: 2, example: 'The cat crept silently towards the bird', category: 'movement' },
      { word: 'trudged', definition: 'walked slowly with heavy steps', pos: 'verb', tier: 3, example: 'They trudged through the thick mud', category: 'movement' },
      { word: 'lunged', definition: 'made a sudden forward movement', pos: 'verb', tier: 3, example: 'The dog lunged for the ball', category: 'movement' },
      { word: 'swayed', definition: 'moved slowly from side to side', pos: 'verb', tier: 2, example: 'The trees swayed in the wind', category: 'movement' },
      { word: 'scrambled', definition: 'climbed quickly using hands and feet', pos: 'verb', tier: 2, example: 'We scrambled up the rocky hillside', category: 'movement' },
      { word: 'tiptoed', definition: 'walked quietly on the tips of one\'s toes', pos: 'verb', tier: 1, example: 'She tiptoed past the sleeping baby', category: 'movement' },
      { word: 'wandered', definition: 'walked slowly without a clear direction', pos: 'verb', tier: 2, example: 'He wandered through the old market', category: 'movement' },
      // More adverbs
      { word: 'gracefully', definition: 'in a smooth and elegant way', pos: 'adverb', tier: 2, example: 'The dancer moved gracefully across the stage', category: 'adverbs' },
      { word: 'frantically', definition: 'in a wild and desperate way', pos: 'adverb', tier: 3, example: 'She frantically searched for her keys', category: 'adverbs' },
      { word: 'silently', definition: 'without making any sound', pos: 'adverb', tier: 1, example: 'Snow fell silently during the night', category: 'adverbs' },
      { word: 'fiercely', definition: 'in a very strong or violent way', pos: 'adverb', tier: 3, example: 'The wind blew fiercely all night', category: 'adverbs' },
      { word: 'wearily', definition: 'in a tired way', pos: 'adverb', tier: 2, example: 'He wearily climbed the stairs to bed', category: 'adverbs' },
      { word: 'defiantly', definition: 'in a boldly resistant way', pos: 'adverb', tier: 4, example: 'She defiantly refused to give up', category: 'adverbs' },
      { word: 'cheerfully', definition: 'in a happy and positive way', pos: 'adverb', tier: 1, example: 'He cheerfully greeted everyone', category: 'adverbs' },
      { word: 'nervously', definition: 'in an anxious or worried way', pos: 'adverb', tier: 1, example: 'She nervously waited for her turn', category: 'adverbs' },
    ];
    movementWords.forEach(w => insertWord(w, movementId));
  }

  // ============================================================
  // Add more synonym/antonym relationships for new words
  // ============================================================
  console.log('Adding word relationships...');
  const allVocab = queryAll<{ id: string; word: string }>('SELECT id, word FROM vocabulary');
  const wordMap = new Map<string, string>();
  allVocab.forEach(v => wordMap.set(v.word.toLowerCase(), v.id));

  const newSynonyms = [
    ['radiant', 'brilliant'],
    ['luminous', 'glowing'],
    ['dim', 'faded'],
    ['drizzle', 'shower'],
    ['tempest', 'storm'],
    ['drenched', 'soaked'],
    ['shallow', 'thin'],
    ['tangled', 'twisted'],
    ['enchanted', 'magical'],
    ['courageous', 'brave'],
    ['timid', 'shy'],
    ['beaming', 'smiling'],
    ['stumbled', 'tripped'],
    ['sprinted', 'dashed'],
    ['crept', 'tiptoed'],
    ['trudged', 'traipsed'],
    ['frantically', 'anxiously'],
    ['silently', 'quietly'],
    ['cheerfully', 'happily'],
    ['wearily', 'tiredly'],
    ['gazed', 'stared'],
    ['glanced', 'peeked'],
    ['vast', 'colossal'],
    ['vibrant', 'vivid'],
  ];

  const newAntonyms = [
    ['shallow', 'deep'],
    ['dim', 'brilliant'],
    ['radiant', 'dim'],
    ['pale', 'tanned'],
    ['courageous', 'timid'],
    ['generous', 'selfish'],
    ['silently', 'loudly'],
    ['cheerfully', 'miserably'],
    ['sweltering', 'crisp'],
    ['nocturnal', 'diurnal'],
  ];

  let relsAdded = 0;

  newSynonyms.forEach(([w1, w2]) => {
    const id1 = wordMap.get(w1.toLowerCase());
    const id2 = wordMap.get(w2.toLowerCase());
    if (id1 && id2) {
      // Check if relationship already exists
      const exists = queryOne<any>(
        'SELECT id FROM word_relationships WHERE word_id = ? AND related_word_id = ?',
        [id1, id2]
      );
      if (!exists) {
        execute(
          'INSERT INTO word_relationships (id, word_id, related_word_id, relationship_type) VALUES (?, ?, ?, ?)',
          [uuid(), id1, id2, 'synonym']
        );
        relsAdded++;
      }
    }
  });

  newAntonyms.forEach(([w1, w2]) => {
    const id1 = wordMap.get(w1.toLowerCase());
    const id2 = wordMap.get(w2.toLowerCase());
    if (id1 && id2) {
      const exists = queryOne<any>(
        'SELECT id FROM word_relationships WHERE word_id = ? AND related_word_id = ?',
        [id1, id2]
      );
      if (!exists) {
        execute(
          'INSERT INTO word_relationships (id, word_id, related_word_id, relationship_type) VALUES (?, ?, ?, ?)',
          [uuid(), id1, id2, 'antonym']
        );
        relsAdded++;
      }
    }
  });

  console.log(`\nDone! Added ${added} new words and ${relsAdded} new relationships.`);
  const finalCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM vocabulary');
  console.log(`Total vocabulary: ${finalCount?.count} words`);
}

addWords().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
