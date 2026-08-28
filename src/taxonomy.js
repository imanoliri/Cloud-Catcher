
const EXTRA_REFERENCE_IMAGES={
  cirrus:[
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cirrus uncinus clouds in the morning sky.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:Cirrus_uncinus_clouds_in_the_morning_sky.jpg'},
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Quill-shaped cirrus cloud.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:Quill-shaped_cirrus_cloud.jpg'}
  ],
  cirrocumulus:[
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/2023-07-22 - Cirrocumulus lacunosus - solitary cloud - zenith - DSG1929-11 - crop mid right.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:2023-07-22_-_Cirrocumulus_lacunosus_-_solitary_cloud_-_zenith_-_DSG1929-11_-_crop_mid_right.jpg'},
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cirrocumulus clouds over Bergsfjorden, Senja, Troms, Norway, 2015 September.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:Cirrocumulus_clouds_over_Bergsfjorden,_Senja,_Troms,_Norway,_2015_September.jpg'}
  ],
  cirrostratus:[
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/2024-03-01 - Cirrostratus - halo (22 deg) centered on sun - DSN2151-1.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:2024-03-01_-_Cirrostratus_-_halo_(22_deg)_centered_on_sun_-_DSN2151-1.jpg'},
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Halo in cirrostratus 1.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:Halo_in_cirrostratus_1.jpg'}
  ],
  altocumulus:[
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Altocumulus maculatus and Altocumulus undulatus Forest Oak Blvd Ballina NSW L1020943.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:Altocumulus_maculatus_and_Altocumulus_undulatus_Forest_Oak_Blvd_Ballina_NSW_L1020943.jpg'},
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Altocumulus 006.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:Altocumulus_006.jpg'}
  ],
  altostratus:[
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Altostratus with stratocumulus under 2.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:Altostratus_with_stratocumulus_under_2.jpg'},
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Altostratus cumulus 1.JPG?width=220',page:'https://commons.wikimedia.org/wiki/File:Altostratus_cumulus_1.JPG'}
  ],
  nimbostratus:[
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nimbostratus and air current.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:Nimbostratus_and_air_current.jpg'},
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nimbostratus Forest.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:Nimbostratus_Forest.jpg'}
  ],
  stratocumulus:[
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Stratocumulus Cloud in Milton, Florida.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:Stratocumulus_Cloud_in_Milton,_Florida.jpg'},
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Stratocumulus clouds in Wilmington, North Carolina, U.S.A.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:Stratocumulus_clouds_in_Wilmington,_North_Carolina,_U.S.A.jpg'}
  ],
  stratus:[
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Stratus-Opacus-Uniformis.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:Stratus-Opacus-Uniformis.jpg'},
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Céu com nuvens stratus.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:C%C3%A9u_com_nuvens_stratus.jpg'}
  ],
  cumulus:[
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cumulus clouds panorama.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:Cumulus_clouds_panorama.jpg'},
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cumulus congestus cloud in sky.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:Cumulus_congestus_cloud_in_sky.jpg'}
  ],
  cumulonimbus:[
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cloud cumulonimbus at baltic sea(1).jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:Cloud_cumulonimbus_at_baltic_sea(1).jpg'},
    {image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cumulonimbus cloud in Dooars.jpg?width=220',page:'https://commons.wikimedia.org/wiki/File:Cumulonimbus_cloud_in_Dooars.jpg'}
  ]
};

export const LEVEL_ONE=[
{id:'cirrus',name:'Cirrus',code:'Ci',level:1,parentId:null,family:'high',summary:'Thin, fibrous ice-cloud streaks high in the sky.',clue:'Look for wispy hair-like filaments.',referenceImage:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cirrus_cloud.jpg?width=800',referencePage:'https://commons.wikimedia.org/wiki/File:Cirrus_cloud.jpg'},
{id:'cirrocumulus',name:'Cirrocumulus',code:'Cc',level:1,parentId:null,family:'high',summary:'Tiny rippled cloudlets in high-level sheets.',clue:'Very small grains or ripples, often a mackerel-sky pattern.',referenceImage:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cirrocumulus.jpg?width=800',referencePage:'https://commons.wikimedia.org/wiki/File:Cirrocumulus.jpg'},
{id:'cirrostratus',name:'Cirrostratus',code:'Cs',level:1,parentId:null,family:'high',summary:'A thin high veil that can cover much of the sky.',clue:'Often produces a halo around the Sun or Moon.',referenceImage:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cirrostratus.jpg?width=800',referencePage:'https://commons.wikimedia.org/wiki/File:Cirrostratus.jpg'},
{id:'altocumulus',name:'Altocumulus',code:'Ac',level:1,parentId:null,family:'middle',summary:'Mid-level patches or rolls made of rounded cloud elements.',clue:'Cloudlets look larger than cirrocumulus but smaller than stratocumulus.',referenceImage:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Altocumulus_cloud.jpg?width=800',referencePage:'https://commons.wikimedia.org/wiki/File:Altocumulus_cloud.jpg'},
{id:'altostratus',name:'Altostratus',code:'As',level:1,parentId:null,family:'middle',summary:'A broad gray or blue-gray mid-level sheet.',clue:'The Sun may show dimly through it, without a halo.',referenceImage:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Altostratus_clouds.jpg?width=800',referencePage:'https://commons.wikimedia.org/wiki/File:Altostratus_clouds.jpg'},
{id:'nimbostratus',name:'Nimbostratus',code:'Ns',level:1,parentId:null,family:'middle',summary:'A thick, dark layer associated with widespread steady precipitation.',clue:'Featureless rain cloud covering much of the sky.',referenceImage:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nimbostratus_clouds.jpg?width=800',referencePage:'https://commons.wikimedia.org/wiki/File:Nimbostratus_clouds.jpg'},
{id:'stratocumulus',name:'Stratocumulus',code:'Sc',level:1,parentId:null,family:'low',summary:'Low lumpy layers, rolls, or patches with broad cloud elements.',clue:'Large rounded masses arranged into a low sheet.',referenceImage:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Stratocumulus_Cloud.jpg?width=800',referencePage:'https://commons.wikimedia.org/wiki/File:Stratocumulus_Cloud.jpg'},
{id:'stratus',name:'Stratus',code:'St',level:1,parentId:null,family:'low',summary:'A low, uniform gray layer resembling lifted fog.',clue:'Flat, featureless, low cloud deck.',referenceImage:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Stratus_Cloud.jpg?width=800',referencePage:'https://commons.wikimedia.org/wiki/File:Stratus_Cloud.jpg'},
{id:'cumulus',name:'Cumulus',code:'Cu',level:1,parentId:null,family:'vertical',summary:'Detached heaps with crisp edges and relatively flat bases.',clue:'Classic cauliflower clouds with vertical growth.',referenceImage:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cumulus_Cloud.jpg?width=800',referencePage:'https://commons.wikimedia.org/wiki/File:Cumulus_Cloud.jpg'},
{id:'cumulonimbus',name:'Cumulonimbus',code:'Cb',level:1,parentId:null,family:'vertical',summary:'Deep storm clouds with strong vertical development.',clue:'Towering cloud, often with an anvil-shaped top.',referenceImage:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cumulonimbus_cloud.jpg?width=800',referencePage:'https://commons.wikimedia.org/wiki/File:Cumulonimbus_cloud.jpg'}
].map(type=>({...type,referenceImages:[{image:type.referenceImage,page:type.referencePage},...EXTRA_REFERENCE_IMAGES[type.id]]}));
export const getCloudType=id=>LEVEL_ONE.find(c=>c.id===id)??null;
export const getChildren=parentId=>LEVEL_ONE.filter(c=>c.parentId===parentId);
