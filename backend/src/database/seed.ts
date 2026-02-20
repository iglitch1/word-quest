import { initializeDatabase, execute, queryOne } from './db';
import { v4 as uuid } from 'uuid';

interface World {
  id: string;
  name: string;
  description: string;
  theme: string;
  display_order: number;
  icon_emoji: string;
  color_primary: string;
  color_secondary: string;
  unlock_stars_required: number;
}

interface Level {
  id: string;
  world_id: string;
  level_number: number;
  name: string;
  difficulty_tier: number;
  target_word_count: number;
  time_limit_seconds: number;
  base_coins: number;
}

interface Vocabulary {
  id: string;
  word: string;
  definition: string;
  part_of_speech: string;
  difficulty_tier: number;
  example_sentence: string;
  category: string;
  world_id: string;
}

interface CharacterItem {
  id: string;
  name: string;
  type: 'base' | 'hat' | 'outfit' | 'pet' | 'effect';
  asset_key: string;
  cost_coins: number;
  is_default: boolean;
}

export async function runSeed() {
  // Check if already seeded
  const worldCount = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM worlds');
  if (worldCount && worldCount.count > 0) {
    console.log('Database already seeded!');
    return;
  }

  console.log('Seeding worlds...');
  const worlds = createWorlds();
  for (const world of worlds) {
    await execute(
      `INSERT INTO worlds (id, name, description, theme, display_order, icon_emoji, color_primary, color_secondary, unlock_stars_required)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [world.id, world.name, world.description, world.theme, world.display_order, world.icon_emoji, world.color_primary, world.color_secondary, world.unlock_stars_required]
    );
  }

  console.log('Seeding levels...');
  const levels = createLevels(worlds);
  for (const level of levels) {
    await execute(
      `INSERT INTO levels (id, world_id, level_number, name, difficulty_tier, target_word_count, time_limit_seconds, base_coins)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [level.id, level.world_id, level.level_number, level.name, level.difficulty_tier, level.target_word_count, level.time_limit_seconds, level.base_coins]
    );
  }

  console.log('Seeding vocabulary...');
  const vocabulary = createVocabulary(worlds);
  for (const word of vocabulary) {
    await execute(
      `INSERT INTO vocabulary (id, word, definition, part_of_speech, difficulty_tier, example_sentence, category, world_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [word.id, word.word, word.definition, word.part_of_speech, word.difficulty_tier, word.example_sentence, word.category, word.world_id]
    );
  }

  console.log('Seeding word relationships...');
  const relationships = createWordRelationships(vocabulary);
  for (const rel of relationships) {
    await execute(
      `INSERT INTO word_relationships (id, word_id, related_word_id, relationship_type)
       VALUES (?, ?, ?, ?)`,
      [uuid(), rel.word_id, rel.related_word_id, rel.relationship_type]
    );
  }

  console.log('Seeding character items...');
  const items = createCharacterItems();
  for (const item of items) {
    await execute(
      `INSERT INTO character_items (id, name, type, asset_key, cost_coins, is_default)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [item.id, item.name, item.type, item.asset_key, item.cost_coins, item.is_default]
    );
  }

  console.log('Seeding complete!');
}

function createWorlds(): World[] {
  return [
    {
      id: uuid(),
      name: 'Sunbeam Meadows',
      description: 'A bright and sunny world full of descriptive words about light and warmth',
      theme: 'sun',
      display_order: 1,
      icon_emoji: '☀️',
      color_primary: '#f59e0b',
      color_secondary: '#fde68a',
      unlock_stars_required: 0,
    },
    {
      id: uuid(),
      name: 'Stormcloud Heights',
      description: 'Experience the power of weather with words about clouds, rain, and wind',
      theme: 'weather',
      display_order: 2,
      icon_emoji: '⛈️',
      color_primary: '#6366f1',
      color_secondary: '#c7d2fe',
      unlock_stars_required: 5,
    },
    {
      id: uuid(),
      name: 'Coral Kingdom',
      description: 'Dive into the ocean and learn words about beaches and the sea',
      theme: 'beach_sea',
      display_order: 3,
      icon_emoji: '🌊',
      color_primary: '#06b6d4',
      color_secondary: '#a5f3fc',
      unlock_stars_required: 15,
    },
    {
      id: uuid(),
      name: 'Whispering Woods',
      description: 'Explore the forest and discover words about trees and nature',
      theme: 'forest',
      display_order: 4,
      icon_emoji: '🌲',
      color_primary: '#16a34a',
      color_secondary: '#bbf7d0',
      unlock_stars_required: 30,
    },
    {
      id: uuid(),
      name: 'Portrait Gallery',
      description: 'Learn descriptive words about hair, eyes, and facial features',
      theme: 'appearance',
      display_order: 5,
      icon_emoji: '🎨',
      color_primary: '#ec4899',
      color_secondary: '#fbcfe8',
      unlock_stars_required: 45,
    },
    {
      id: uuid(),
      name: 'Adventure Trail',
      description: 'Master movement verbs and adverbs for dynamic descriptions',
      theme: 'movement',
      display_order: 6,
      icon_emoji: '🗺️',
      color_primary: '#8b5cf6',
      color_secondary: '#ddd6fe',
      unlock_stars_required: 60,
    },
  ];
}

function createLevels(worlds: World[]): Level[] {
  const levels: Level[] = [];

  worlds.forEach((world, worldIndex) => {
    for (let i = 1; i <= 5; i++) {
      levels.push({
        id: uuid(),
        world_id: world.id,
        level_number: i,
        name: `${world.name} - Level ${i}`,
        difficulty_tier: i,
        target_word_count: 5 + i,
        time_limit_seconds: 120 + i * 10,
        base_coins: 100 + i * 20,
      });
    }
  });

  return levels;
}

function createVocabulary(worlds: World[]): Vocabulary[] {
  const vocabulary: Vocabulary[] = [];
  const sunWorld = worlds[0];
  const weatherWorld = worlds[1];
  const seaWorld = worlds[2];
  const forestWorld = worlds[3];
  const appearanceWorld = worlds[4];
  const movementWorld = worlds[5];

  // SUN words
  const sunAdjectives = [
    { word: 'vivid', definition: 'bright and strong', example: 'The vivid sunset painted the sky orange', tier: 1 },
    { word: 'dazzling', definition: 'extremely bright and impressive', example: 'The dazzling sunlight made her squint', tier: 2 },
    { word: 'shimmering', definition: 'shining with a soft, wavering light', example: 'The shimmering heat rose from the road', tier: 3 },
    { word: 'scorching', definition: 'very hot, burning', example: 'It was a scorching summer day', tier: 4 },
    { word: 'fierce', definition: 'very strong or intense', example: 'The fierce sun beat down on them', tier: 2 },
    { word: 'golden', definition: 'having the colour of gold', example: 'The golden light filled the room', tier: 1 },
    { word: 'watery', definition: 'weak and pale', example: 'A watery sun appeared through the clouds', tier: 3 },
    { word: 'weak', definition: 'lacking strength or intensity', example: 'The weak sunlight barely warmed them', tier: 1 },
  ];

  const sunVerbs = [
    { word: 'burst', definition: 'to break open or appear suddenly', example: 'Sunlight burst through the curtains', tier: 2 },
    { word: 'blaze', definition: 'to burn or shine brightly', example: 'The sun blazed overhead', tier: 2 },
    { word: 'glitter', definition: 'to sparkle with flashes of light', example: 'The sea glittered in the sunlight', tier: 3 },
    { word: 'beam', definition: 'to shine brightly', example: 'Sunlight beamed through the window', tier: 1 },
    { word: 'gleam', definition: 'to shine softly', example: 'The polished floor gleamed', tier: 2 },
    { word: 'shimmer', definition: 'to shine with a soft, slightly wavering light', example: 'The lake shimmered in the afternoon heat', tier: 3 },
    { word: 'glimmer', definition: 'to shine faintly or unsteadily', example: 'Stars glimmered in the night sky', tier: 3 },
  ];

  sunAdjectives.forEach(adj => {
    vocabulary.push({
      id: uuid(),
      word: adj.word,
      definition: adj.definition,
      part_of_speech: 'adjective',
      difficulty_tier: adj.tier,
      example_sentence: adj.example,
      category: 'sun_light',
      world_id: sunWorld.id,
    });
  });

  sunVerbs.forEach(verb => {
    vocabulary.push({
      id: uuid(),
      word: verb.word,
      definition: verb.definition,
      part_of_speech: 'verb',
      difficulty_tier: verb.tier,
      example_sentence: verb.example,
      category: 'sun_light',
      world_id: sunWorld.id,
    });
  });

  // WEATHER words (Clouds)
  const cloudWords = [
    { word: 'dark', definition: 'not light or bright', example: 'Dark clouds filled the sky', tier: 1, pos: 'adjective' },
    { word: 'grey', definition: 'the color between black and white', example: 'Grey clouds blocked the sun', tier: 1, pos: 'adjective' },
    { word: 'heavy', definition: 'of great weight', example: 'Heavy clouds gathered overhead', tier: 1, pos: 'adjective' },
    { word: 'bruised', definition: 'having a dark, damaged appearance', example: 'Bruised clouds approached from the west', tier: 3, pos: 'adjective' },
    { word: 'ominous', definition: 'suggesting something bad is going to happen', example: 'Ominous clouds hung in the sky', tier: 4, pos: 'adjective' },
    { word: 'fluffy', definition: 'light and soft-looking', example: 'Fluffy clouds dotted the blue sky', tier: 1, pos: 'adjective' },
    { word: 'drifted', definition: 'moved slowly and gently', example: 'Clouds drifted across the sky', tier: 2, pos: 'verb' },
    { word: 'floated', definition: 'moved through the air lightly', example: 'White clouds floated peacefully', tier: 1, pos: 'verb' },
    { word: 'glided', definition: 'moved smoothly and effortlessly', example: 'Storm clouds glided toward us', tier: 3, pos: 'verb' },
  ];

  // RAIN words
  const rainWords = [
    { word: 'icy', definition: 'extremely cold', example: 'Icy rain stung our faces', tier: 3, pos: 'adjective' },
    { word: 'bitter', definition: 'unpleasantly cold', example: 'Bitter rain fell all night', tier: 2, pos: 'adjective' },
    { word: 'relentless', definition: 'never stopping', example: 'The relentless rain continued for days', tier: 4, pos: 'adjective' },
    { word: 'torrential', definition: 'falling rapidly and in large quantities', example: 'Torrential rain flooded the streets', tier: 5, pos: 'adjective' },
    { word: 'poured', definition: 'flowed in large amounts', example: 'Rain poured from the sky', tier: 1, pos: 'verb' },
    { word: 'drummed', definition: 'made a continuous rhythmic sound', example: 'Rain drummed on the roof', tier: 3, pos: 'verb' },
    { word: 'pelted', definition: 'struck repeatedly and hard', example: 'Hail pelted the windows', tier: 4, pos: 'verb' },
    { word: 'cascaded', definition: 'poured down rapidly', example: 'Water cascaded from the gutters', tier: 4, pos: 'verb' },
  ];

  // WIND words
  const windWords = [
    { word: 'gentle', definition: 'mild and soft', example: 'A gentle breeze ruffled the leaves', tier: 1, pos: 'adjective' },
    { word: 'ferocious', definition: 'very fierce or violent', example: 'A ferocious wind knocked over trees', tier: 4, pos: 'adjective' },
    { word: 'whistling', definition: 'making a high-pitched sound', example: 'Whistling wind swirled around the house', tier: 3, pos: 'adjective' },
    { word: 'tickled', definition: 'touched lightly', example: 'The wind tickled her cheeks', tier: 2, pos: 'verb' },
    { word: 'whipped', definition: 'moved very fast', example: 'Wind whipped through the canyon', tier: 3, pos: 'verb' },
    { word: 'whispered', definition: 'spoke very softly', example: 'The wind whispered through the trees', tier: 2, pos: 'verb' },
    { word: 'roared', definition: 'made a loud, deep sound', example: 'The storm wind roared and howled', tier: 3, pos: 'verb' },
  ];

  [cloudWords, rainWords, windWords].forEach((wordGroup, groupIdx) => {
    wordGroup.forEach(w => {
      vocabulary.push({
        id: uuid(),
        word: w.word,
        definition: w.definition,
        part_of_speech: w.pos,
        difficulty_tier: w.tier,
        example_sentence: w.example,
        category: ['clouds', 'rain', 'wind'][groupIdx],
        world_id: weatherWorld.id,
      });
    });
  });

  // SEA & BEACH words
  const seaWords = [
    { word: 'azure', definition: 'bright blue like a clear sky', example: 'The azure water sparkled', tier: 3, pos: 'adjective' },
    { word: 'turquoise', definition: 'greenish-blue', example: 'Turquoise waves lapped at the shore', tier: 3, pos: 'adjective' },
    { word: 'emerald', definition: 'bright green', example: 'The emerald sea was beautiful', tier: 3, pos: 'adjective' },
    { word: 'colossal', definition: 'extremely large', example: 'Colossal waves crashed on the rocks', tier: 4, pos: 'adjective' },
    { word: 'vast', definition: 'very great in size', example: 'The vast ocean stretched to the horizon', tier: 2, pos: 'adjective' },
    { word: 'salty', definition: 'containing salt', example: 'Salty spray misted over the beach', tier: 2, pos: 'adjective' },
    { word: 'perilous', definition: 'full of danger', example: 'The perilous waters were treacherous', tier: 4, pos: 'adjective' },
    { word: 'murky', definition: 'dark and dirty', example: 'Murky water hid the sea floor', tier: 3, pos: 'adjective' },
    { word: 'tranquil', definition: 'calm and peaceful', example: 'On calm days the sea was tranquil', tier: 3, pos: 'adjective' },
    { word: 'crash', definition: 'to make a loud sound of impact', example: 'Waves crash against the rocks', tier: 1, pos: 'verb' },
    { word: 'splash', definition: 'to hit water with force', example: 'Water splashed over the sides', tier: 1, pos: 'verb' },
    { word: 'surge', definition: 'to rise and swell', example: 'The tide surged up the beach', tier: 3, pos: 'verb' },
    { word: 'churn', definition: 'to move about violently', example: 'Storm waters churned and foamed', tier: 3, pos: 'verb' },
    { word: 'ripple', definition: 'to form small waves', example: 'Gentle winds rippled the surface', tier: 2, pos: 'verb' },
    { word: 'plunge', definition: 'to jump or dive quickly', example: 'She plunged into the cold water', tier: 3, pos: 'verb' },
    { word: 'lighthouse', definition: 'a tower with a light to guide ships', example: 'The lighthouse beam cut through the fog', tier: 2, pos: 'noun' },
    { word: 'seaweed', definition: 'plants that grow in the sea', example: 'Seaweed tangled in the net', tier: 2, pos: 'noun' },
    { word: 'current', definition: 'a body of water moving in one direction', example: 'The ocean current pulled us along', tier: 3, pos: 'noun' },
  ];

  seaWords.forEach(w => {
    vocabulary.push({
      id: uuid(),
      word: w.word,
      definition: w.definition,
      part_of_speech: w.pos,
      difficulty_tier: w.tier,
      example_sentence: w.example,
      category: 'beach_sea',
      world_id: seaWorld.id,
    });
  });

  // FOREST words
  const forestWords = [
    { word: 'towering', definition: 'very tall', example: 'Towering trees reached the clouds', tier: 2, pos: 'adjective' },
    { word: 'majestic', definition: 'having impressive beauty', example: 'The majestic forest was breathtaking', tier: 3, pos: 'adjective' },
    { word: 'lush', definition: 'growing thickly and healthily', example: 'Lush vegetation covered the forest floor', tier: 2, pos: 'adjective' },
    { word: 'gnarled', definition: 'knobbly and twisted', example: 'An old gnarled oak stood in the clearing', tier: 4, pos: 'adjective' },
    { word: 'ancient', definition: 'very old', example: 'Ancient trees had stood for centuries', tier: 2, pos: 'adjective' },
    { word: 'dappled', definition: 'marked with spots of light and shadow', example: 'Sunlight dappled the forest floor', tier: 4, pos: 'adjective' },
    { word: 'dense', definition: 'closely packed together', example: 'The dense undergrowth blocked the path', tier: 2, pos: 'adjective' },
    { word: 'whisper', definition: 'to make a soft, rustling sound', example: 'Trees whispered in the breeze', tier: 2, pos: 'verb' },
    { word: 'rustle', definition: 'to make a soft, whispering sound', example: 'Leaves rustled overhead', tier: 2, pos: 'verb' },
    { word: 'creak', definition: 'to make a harsh, high sound', example: 'Branches creaked in the wind', tier: 2, pos: 'verb' },
    { word: 'crunch', definition: 'to crush with a noisy sound', example: 'Footsteps crunched on the twigs', tier: 2, pos: 'verb' },
    { word: 'canopy', definition: 'a covering of trees', example: 'The forest canopy blocked out the sun', tier: 3, pos: 'noun' },
    { word: 'foliage', definition: 'the leaves of a plant', example: 'Dense green foliage surrounded us', tier: 3, pos: 'noun' },
    { word: 'undergrowth', definition: 'plants growing beneath trees', example: 'We pushed through the thick undergrowth', tier: 3, pos: 'noun' },
  ];

  forestWords.forEach(w => {
    vocabulary.push({
      id: uuid(),
      word: w.word,
      definition: w.definition,
      part_of_speech: w.pos,
      difficulty_tier: w.tier,
      example_sentence: w.example,
      category: 'forest',
      world_id: forestWorld.id,
    });
  });

  // HAIR words
  const hairWords = [
    { word: 'jet-black', definition: 'very dark black', example: 'Her jet-black hair gleamed', tier: 2, pos: 'adjective' },
    { word: 'golden', definition: 'like the color of gold', example: 'Golden hair caught the light', tier: 1, pos: 'adjective' },
    { word: 'auburn', definition: 'reddish-brown', example: 'Auburn curls framed her face', tier: 3, pos: 'adjective' },
    { word: 'straight', definition: 'not curly or wavy', example: 'Long straight hair fell down her back', tier: 1, pos: 'adjective' },
    { word: 'curly', definition: 'having curls', example: 'Curly hair bounced as she walked', tier: 1, pos: 'adjective' },
    { word: 'wavy', definition: 'having gentle waves', example: 'Wavy hair framed her shoulders', tier: 1, pos: 'adjective' },
    { word: 'frizzy', definition: 'formed into tight curls', example: 'Humid weather made her hair frizzy', tier: 2, pos: 'adjective' },
    { word: 'neat', definition: 'tidy and orderly', example: 'Her neat braids were perfect', tier: 1, pos: 'adjective' },
    { word: 'dishevelled', definition: 'untidy and messy', example: 'His dishevelled hair stuck up in all directions', tier: 3, pos: 'adjective' },
    { word: 'flowed', definition: 'moved smoothly like liquid', example: 'Her hair flowed in the wind', tier: 2, pos: 'verb' },
    { word: 'cascaded', definition: 'poured down', example: 'Long locks cascaded down her back', tier: 3, pos: 'verb' },
    { word: 'fastened', definition: 'attached or secured', example: 'She fastened her hair with a ribbon', tier: 2, pos: 'verb' },
  ];

  hairWords.forEach(w => {
    vocabulary.push({
      id: uuid(),
      word: w.word,
      definition: w.definition,
      part_of_speech: w.pos,
      difficulty_tier: w.tier,
      example_sentence: w.example,
      category: 'hair',
      world_id: appearanceWorld.id,
    });
  });

  // EYES words
  const eyeWords = [
    { word: 'blue', definition: 'the color of the sky', example: 'Her blue eyes sparkled', tier: 1, pos: 'adjective' },
    { word: 'green', definition: 'the color of grass', example: 'Green eyes held a mystery', tier: 1, pos: 'adjective' },
    { word: 'brown', definition: 'the color of chocolate', example: 'Dark brown eyes watched us', tier: 1, pos: 'adjective' },
    { word: 'hazel', definition: 'greenish-brown', example: 'Hazel eyes changed color in the light', tier: 2, pos: 'adjective' },
    { word: 'gleaming', definition: 'shining brightly', example: 'Gleaming eyes showed her excitement', tier: 2, pos: 'adjective' },
    { word: 'piercing', definition: 'very sharp and intense', example: 'His piercing gaze followed her', tier: 3, pos: 'adjective' },
    { word: 'mischievous', definition: 'showing a fondness for causing trouble', example: 'Mischievous eyes twinkled with humor', tier: 3, pos: 'adjective' },
    { word: 'shone', definition: 'glowed with light', example: 'Her eyes shone with happiness', tier: 1, pos: 'verb' },
    { word: 'sparkled', definition: 'glittered with flashes of light', example: 'His eyes sparkled with joy', tier: 1, pos: 'verb' },
    { word: 'stared', definition: 'looked fixedly', example: 'He stared in amazement', tier: 1, pos: 'verb' },
    { word: 'squinted', definition: 'looked with partly closed eyes', example: 'She squinted in the bright sun', tier: 2, pos: 'verb' },
  ];

  eyeWords.forEach(w => {
    vocabulary.push({
      id: uuid(),
      word: w.word,
      definition: w.definition,
      part_of_speech: w.pos,
      difficulty_tier: w.tier,
      example_sentence: w.example,
      category: 'eyes',
      world_id: appearanceWorld.id,
    });
  });

  // MOVEMENT VERBS
  const movementWords = [
    { word: 'meandered', definition: 'wandered slowly without purpose', example: 'We meandered through the park', tier: 3, pos: 'verb' },
    { word: 'ambled', definition: 'walked at a slow, relaxed pace', example: 'She ambled along the beach', tier: 3, pos: 'verb' },
    { word: 'strolled', definition: 'walked in a leisurely way', example: 'They strolled hand in hand', tier: 2, pos: 'verb' },
    { word: 'stomped', definition: 'walked heavily and loudly', example: 'He stomped angrily away', tier: 2, pos: 'verb' },
    { word: 'traipsed', definition: 'walked wearily', example: 'We traipsed through the museum', tier: 3, pos: 'verb' },
    { word: 'clambered', definition: 'climbed awkwardly', example: 'The children clambered over the rocks', tier: 3, pos: 'verb' },
    { word: 'dashed', definition: 'ran quickly', example: 'She dashed across the field', tier: 2, pos: 'verb' },
    { word: 'darted', definition: 'moved suddenly and quickly', example: 'The rabbit darted into the bush', tier: 2, pos: 'verb' },
    { word: 'hurtled', definition: 'moved at great speed', example: 'The boulder hurtled down the mountain', tier: 4, pos: 'verb' },
    { word: 'bolted', definition: 'ran away suddenly', example: 'The horse bolted when frightened', tier: 3, pos: 'verb' },
    { word: 'skipped', definition: 'moved with light jumps', example: 'The girl skipped down the path', tier: 1, pos: 'verb' },
    { word: 'bounced', definition: 'jumped repeatedly', example: 'The ball bounced across the floor', tier: 1, pos: 'verb' },
    { word: 'scurried', definition: 'moved hurriedly with quick small steps', example: 'Mice scurried across the floor', tier: 3, pos: 'verb' },
  ];

  movementWords.forEach(w => {
    vocabulary.push({
      id: uuid(),
      word: w.word,
      definition: w.definition,
      part_of_speech: w.pos,
      difficulty_tier: w.tier,
      example_sentence: w.example,
      category: 'movement',
      world_id: movementWorld.id,
    });
  });

  // ADVERBS
  const adverbWords = [
    { word: 'happily', definition: 'in a happy way', example: 'She smiled happily', tier: 1, pos: 'adverb' },
    { word: 'miserably', definition: 'in a sad and miserable way', example: 'He stared miserably at the floor', tier: 2, pos: 'adverb' },
    { word: 'excitedly', definition: 'in an excited way', example: 'She excitedly opened the gift', tier: 2, pos: 'adverb' },
    { word: 'contentedly', definition: 'in a satisfied way', example: 'He sighed contentedly', tier: 3, pos: 'adverb' },
    { word: 'reluctantly', definition: 'unwillingly', example: 'He reluctantly agreed', tier: 3, pos: 'adverb' },
    { word: 'tentatively', definition: 'in a hesitant way', example: 'She tentatively raised her hand', tier: 3, pos: 'adverb' },
    { word: 'cautiously', definition: 'in a careful way', example: 'He cautiously approached the dog', tier: 2, pos: 'adverb' },
    { word: 'anxiously', definition: 'in a worried way', example: 'She anxiously waited for news', tier: 2, pos: 'adverb' },
    { word: 'confidently', definition: 'with assurance and certainty', example: 'He confidently stated his opinion', tier: 2, pos: 'adverb' },
    { word: 'triumphantly', definition: 'in a victorious way', example: 'She smiled triumphantly', tier: 4, pos: 'adverb' },
    { word: 'rapidly', definition: 'quickly and speedily', example: 'The water flowed rapidly', tier: 2, pos: 'adverb' },
    { word: 'swiftly', definition: 'quickly and smoothly', example: 'He swiftly ran away', tier: 2, pos: 'adverb' },
    { word: 'idly', definition: 'without purpose', example: 'She idly flipped through the pages', tier: 3, pos: 'adverb' },
    { word: 'timidly', definition: 'in a shy, nervous way', example: 'The mouse timidly peeked out', tier: 3, pos: 'adverb' },
    { word: 'angrily', definition: 'in an angry way', example: 'He angrily slammed the door', tier: 1, pos: 'adverb' },
    { word: 'fearfully', definition: 'in a frightened way', example: 'She fearfully stepped back', tier: 2, pos: 'adverb' },
    { word: 'breathlessly', definition: 'in a gasping way', example: 'He spoke breathlessly', tier: 3, pos: 'adverb' },
    { word: 'lazily', definition: 'in a relaxed, slow way', example: 'The cat lazily stretched', tier: 2, pos: 'adverb' },
  ];

  adverbWords.forEach(w => {
    vocabulary.push({
      id: uuid(),
      word: w.word,
      definition: w.definition,
      part_of_speech: w.pos,
      difficulty_tier: w.tier,
      example_sentence: w.example,
      category: 'adverbs',
      world_id: movementWorld.id,
    });
  });

  return vocabulary;
}

function createWordRelationships(vocabulary: Vocabulary[]): Array<{ word_id: string; related_word_id: string; relationship_type: string }> {
  const relationships: Array<{ word_id: string; related_word_id: string; relationship_type: string }> = [];
  const wordMap = new Map<string, Vocabulary>();

  vocabulary.forEach(v => wordMap.set(v.word.toLowerCase(), v));

  const synonymPairs = [
    ['vivid', 'dazzling'],
    ['golden', 'amber'],
    ['burst', 'explode'],
    ['whisper', 'murmur'],
    ['vast', 'immense'],
    ['ancient', 'old'],
    ['happy', 'happily'],
  ];

  const antonymPairs = [
    ['dark', 'bright'],
    ['weak', 'strong'],
    ['gentle', 'fierce'],
    ['ancient', 'new'],
  ];

  synonymPairs.forEach(([word1, word2]) => {
    const v1 = wordMap.get(word1.toLowerCase());
    const v2 = wordMap.get(word2.toLowerCase());
    if (v1 && v2) {
      relationships.push({
        word_id: v1.id,
        related_word_id: v2.id,
        relationship_type: 'synonym',
      });
    }
  });

  antonymPairs.forEach(([word1, word2]) => {
    const v1 = wordMap.get(word1.toLowerCase());
    const v2 = wordMap.get(word2.toLowerCase());
    if (v1 && v2) {
      relationships.push({
        word_id: v1.id,
        related_word_id: v2.id,
        relationship_type: 'antonym',
      });
    }
  });

  return relationships;
}

function createCharacterItems(): CharacterItem[] {
  const items: CharacterItem[] = [];

  // Bases
  const bases = [
    { name: 'Explorer', cost: 0, default: true },
    { name: 'Wizard', cost: 100, default: false },
    { name: 'Knight', cost: 100, default: false },
    { name: 'Pirate', cost: 200, default: false },
    { name: 'Fairy', cost: 200, default: false },
    { name: 'Dragon Rider', cost: 500, default: false },
  ];

  bases.forEach(base => {
    items.push({
      id: uuid(),
      name: base.name,
      type: 'base',
      asset_key: `base_${base.name.toLowerCase().replace(/\s+/g, '_')}`,
      cost_coins: base.cost,
      is_default: base.default,
    });
  });

  // Hats
  const hats = [
    { name: 'Crown', cost: 50 },
    { name: 'Wizard Hat', cost: 75 },
    { name: 'Flower Crown', cost: 60 },
    { name: 'Pirate Hat', cost: 80 },
    { name: 'Space Helmet', cost: 150 },
  ];

  hats.forEach(hat => {
    items.push({
      id: uuid(),
      name: hat.name,
      type: 'hat',
      asset_key: `hat_${hat.name.toLowerCase().replace(/\s+/g, '_')}`,
      cost_coins: hat.cost,
      is_default: false,
    });
  });

  // Outfits
  const outfits = [
    { name: 'Royal Cape', cost: 100 },
    { name: 'Star Cloak', cost: 120 },
    { name: 'Forest Tunic', cost: 80 },
    { name: 'Ocean Dress', cost: 100 },
  ];

  outfits.forEach(outfit => {
    items.push({
      id: uuid(),
      name: outfit.name,
      type: 'outfit',
      asset_key: `outfit_${outfit.name.toLowerCase().replace(/\s+/g, '_')}`,
      cost_coins: outfit.cost,
      is_default: false,
    });
  });

  // Pets
  const pets = [
    { name: 'Owl', cost: 150 },
    { name: 'Cat', cost: 100 },
    { name: 'Dragon', cost: 300 },
    { name: 'Unicorn', cost: 250 },
    { name: 'Fox', cost: 120 },
  ];

  pets.forEach(pet => {
    items.push({
      id: uuid(),
      name: pet.name,
      type: 'pet',
      asset_key: `pet_${pet.name.toLowerCase().replace(/\s+/g, '_')}`,
      cost_coins: pet.cost,
      is_default: false,
    });
  });

  // Effects
  const effects = [
    { name: 'Sparkles', cost: 50 },
    { name: 'Fire Trail', cost: 100 },
    { name: 'Rainbow Glow', cost: 150 },
    { name: 'Snowflakes', cost: 80 },
  ];

  effects.forEach(effect => {
    items.push({
      id: uuid(),
      name: effect.name,
      type: 'effect',
      asset_key: `effect_${effect.name.toLowerCase().replace(/\s+/g, '_')}`,
      cost_coins: effect.cost,
      is_default: false,
    });
  });

  return items;
}

async function seedDatabase() {
  console.log('Initializing database...');
  await initializeDatabase();
  await runSeed();
}

// Only run when executed as a script directly
if (require.main === module) {
  seedDatabase().catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}
