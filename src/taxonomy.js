export const LEVEL_ONE=[
{id:'cirrus',name:'Cirrus',code:'Ci',level:1,parentId:null,family:'high',summary:'Thin, fibrous ice-cloud streaks high in the sky.',clue:'Look for wispy hair-like filaments.',reference:'wisps'},
{id:'cirrocumulus',name:'Cirrocumulus',code:'Cc',level:1,parentId:null,family:'high',summary:'Tiny rippled cloudlets in high-level sheets.',clue:'Very small grains or ripples, often a mackerel-sky pattern.',reference:'ripples'},
{id:'cirrostratus',name:'Cirrostratus',code:'Cs',level:1,parentId:null,family:'high',summary:'A thin high veil that can cover much of the sky.',clue:'Often produces a halo around the Sun or Moon.',reference:'veil'},
{id:'altocumulus',name:'Altocumulus',code:'Ac',level:1,parentId:null,family:'middle',summary:'Mid-level patches or rolls made of rounded cloud elements.',clue:'Cloudlets look larger than cirrocumulus but smaller than stratocumulus.',reference:'mid-puffs'},
{id:'altostratus',name:'Altostratus',code:'As',level:1,parentId:null,family:'middle',summary:'A broad gray or blue-gray mid-level sheet.',clue:'The Sun may show dimly through it, without a halo.',reference:'sheet'},
{id:'nimbostratus',name:'Nimbostratus',code:'Ns',level:1,parentId:null,family:'middle',summary:'A thick, dark layer associated with widespread steady precipitation.',clue:'Featureless rain cloud covering much of the sky.',reference:'rain-sheet'},
{id:'stratocumulus',name:'Stratocumulus',code:'Sc',level:1,parentId:null,family:'low',summary:'Low lumpy layers, rolls, or patches with broad cloud elements.',clue:'Large rounded masses arranged into a low sheet.',reference:'low-rolls'},
{id:'stratus',name:'Stratus',code:'St',level:1,parentId:null,family:'low',summary:'A low, uniform gray layer resembling lifted fog.',clue:'Flat, featureless, low cloud deck.',reference:'low-sheet'},
{id:'cumulus',name:'Cumulus',code:'Cu',level:1,parentId:null,family:'vertical',summary:'Detached heaps with crisp edges and relatively flat bases.',clue:'Classic cauliflower clouds with vertical growth.',reference:'heap'},
{id:'cumulonimbus',name:'Cumulonimbus',code:'Cb',level:1,parentId:null,family:'vertical',summary:'Deep storm clouds with strong vertical development.',clue:'Towering cloud, often with an anvil-shaped top.',reference:'tower'}
];
export const getCloudType=id=>LEVEL_ONE.find(c=>c.id===id)??null;
export const getChildren=parentId=>LEVEL_ONE.filter(c=>c.parentId===parentId);
