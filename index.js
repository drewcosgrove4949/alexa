/**
 
 Animal Letters - code based on sample provided by Amazon.
 
 Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
 http://aws.amazon.com/apache2.0/
 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * This sample shows how to create a simple Trivia skill with a multiple choice format. The skill
 * supports 1 player at a time, and does not support games across sessions.
 */

'use strict';

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId = " + event.session.application.applicationId);
		console.log("SESSION = " + JSON.stringify(event.session.attributes));
		console.log("SESSION = " + JSON.stringify(event.request));

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

		if (event.session.application.applicationId !== "amzn1.ask.skill.5a1d46f3-8db9-467c-a36d-fbc48ef6d4b0") {
			context.fail("Invalid Application ID");
		}

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    getWelcomeResponse(true,session,callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

		console.log("INTENT NAME: "+intentName);
		
    // handle yes/no(anything but yes) intent after the user has been prompted
    if (session.attributes && session.attributes.userPromptedToContinue) {
        delete session.attributes.userPromptedToContinue;
		if ("AMAZON.YesIntent" === intentName) {handleRepeatRequest(intent, session, callback)}
			else if ("AMAZON.StartOverIntent" === intentName) {
				getWelcomeResponse(false,session,callback);
			} else if ("AMAZON.RepeatIntent" === intentName) {
				handleRepeatRequest(intent, session, callback);
			} else if ("AMAZON.HelpIntent" === intentName) {
				handleGetHelpRequest(intent, session, callback);
			} else if ("AMAZON.StopIntent" === intentName) {
				handleFinishSessionRequest(intent, session, callback);
			} else if ("AMAZON.CancelIntent" === intentName) {
				handleFinishSessionRequest(intent, session, callback);
			} else {handleFinishSessionRequest(intent, session, callback)
			}
        } 
		
	// handle yes/no(anything but yes) intent after the user has been prompted for another game
    else if (session.attributes && session.attributes.userPromptedForAnotherGame) {
        session.attributes.userPromptedForAnotherGame = false;
        if ("AMAZON.NoIntent" === intentName) {handleFinishSessionRequest(intent, session, callback)}
			else if ("AMAZON.StartOverIntent" === intentName) {
				getWelcomeResponse(false,session,callback);
			} else if ("AMAZON.RepeatIntent" === intentName) {
				session.attributes.userPromptedForAnotherGame = true;
				handleRepeatRequest(intent, session, callback);
			} else if ("AMAZON.HelpIntent" === intentName) {
				session.attributes.userPromptedForAnotherGame = true;
				handleGetHelpRequest(intent, session, callback);
			} else if ("AMAZON.StopIntent" === intentName) {
				handleFinishSessionRequest(intent, session, callback);
			} else if ("AMAZON.CancelIntent" === intentName) {
				handleFinishSessionRequest(intent, session, callback);
			} else {getWelcomeResponse(false,session,callback)}
	}
			
    // dispatch custom intents to handlers here
    if ("AnswerIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AnswerOnlyIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("DontKnowIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AMAZON.YesIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AMAZON.NoIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AMAZON.StartOverIntent" === intentName) {
        getWelcomeResponse(false,session,callback);
    } else if ("AMAZON.RepeatIntent" === intentName) {
        handleRepeatRequest(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        handleGetHelpRequest(intent, session, callback);
    } else if ("AMAZON.StopIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else if ("AMAZON.CancelIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else {handleFinishSessionRequest(intent, session, callback)
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // Add any cleanup logic here
}

// ------- Skill specific business logic -------

var CARD_TITLE = "Guess Tracker";

function getWordAnswer (currentScore) {

	if (currentScore == 0) {var wordAnswer = " correct answers. "} 
	if (currentScore == 1) {var wordAnswer = " correct answer. "};
	if (currentScore > 1) {var wordAnswer = " correct answers in a row. "};
	
	return wordAnswer;
};

function getWelcomeResponse(justLaunched,session,callback) {

	var animalAnswers = [
		{letter: "A", 
		animals:["aardvark","aardwolf","abalone","aberdeen angus","adder","afghan hound","african elephant","albatross","alligator","allosaurus","alpaca","anaconda","anchovy","angelfish","anglerfish","ant","anteater","antelope","apatosaurus","ape","aphid","arctic fox","armadillo","ass","auk","avocet"]},
		{letter: "B", 
		animals:["baboon","bactrian camel","badger","bald eagle","bandicoot","barn owl","barnacle","barracuda","basking shark","basset hound","bat","beagle","bear","bearded dragon","beaver","bedbug","bee","beetle","beluga whale","bengal tiger","bighorn sheep","bird","bird of paradise","bison","bloodhound","blue whale","bluebird","bluebottle","blue jay","boa constrictor","boar","bobcat","bonobo","booby","border collie","boston terrier","bottlenose dolphin","boxer","brontosaurus","budgie","buffalo","bug","bull","bulldog","bullfrog","bull mastiff","bull terrier","bumble bee","burmese cat","burro","bushbaby","bustard","butterfly","buzzard"]},	
		{letter: "C", 
		animals:["calf","calico cat","canary","camel","capybara","cardinal","caribou","carp","cassowary","cat","caterpillar","catfish","centipede","chachalaca","chaffinch","chameleon","cheetah","chickadee","chicken","chickenhawk","chihuahua","chimpanzee","chinchilla","chipmunk","chuck","chuckwalla","cicada","civet cat","clam","clownfish","cobra","cockatiel","cockatoo","cockerel","cockroach","cocker spaniel","cod","colt","collie","condor","copperhead snake","coral","coral snake","cormorant","cottonmouth snake","cougar","cow","coyote","crab","crane","crane fly","crayfish","cricket","crocodile","crow","cub","cuckoo","cuttlefish"]},	
		{letter: "D", 
		animals:["dachshund","daddy long legs","dalmatian","deer","dingo","diplodocus","doberman pinscher","dodo","dog","dogfish","dolphin","donkey","dormouse","dove","dragonfly","dromedary camel","duck","duck billed platypus","dung beetle"]},	
		{letter: "E", 
		animals:["eagle","earthworm","earwig","eel","egret","electric eel","elephant","elephant beetle","elephant seal","elk","emperor penguin","ermine","emu","ewe"]},	
		{letter: "F", 
		animals:["falcon","fawn","ferret","field mouse","fire ant","firefly","fish","finch","flamingo","flatworm","flea","flounder","fluke","fly","flying fish","flying frog","flying squirrel","forky taily","foal","fox","fox squirrel","fox terrier","foxhound","french bulldog","frog","fruit bat","fruit fly"]},	
		{letter: "G", 
		animals:["gannett","garter snake","gator","gazelle","gecko","gerbil","german shepherd","ghost crab","giant clam","giant panda","giant squid","giant tortoise","gibbon","gila monster","giraffe","glow worm","gnat","gnu","goat","goldfinch","goldfish","golden eagle","golden retriever","goose","gopher","gorilla","goshawk","grasshopper","gray fox","gray seal","gray squirrel","gray wolf","great dane","great white shark","green and black poison dart frog","greenfly","greyhound","grizzly","grizzly bear","groundhog","ground squirrel","grouper","grouse","guinea pig","guineafowl","gull","guppy"]},	
		{letter: "H", 
		animals:["haddock","halibut","hammerhead shark","hamster","hare","harrier","hawk","hedgehog","hen","hermit crab","heron","herring","highland cow","hippopotamus","hissing cockroach","hog","honey badger","honey bee","honey bear","honeycreeper","hoot owl","hornbill","horned lizard","hornet","horse","horse fly","horseshoe crab","hound","housefly","humans","hummingbird","humpback whale","husky","hyena"]},	
		{letter: "J", 
		animals:["jack russell","jackal","jackass","jackdaw","jackrabbit","jaguar","japanese chin","jay","jellyfish","jerboa","joey","junebug","jungle cat"]},	
		{letter: "K", 
		animals:["kangaroo","kangaroo rat","kestrel","kid","killer bee","killer whale","king cobra","king crab","king penguin","kingfisher","king snake","kinkajou","kite","kitten","kiwi","koala","kodiak bear","komodo dragon","kookaburra","krill"]},	
		{letter: "L", 
		animals:["labrador","labra doodle","ladybird","ladybug","lamb","lamprey","lark","leech","lemming","lemur","leopard","leopard seal","leopard shark","leveret","lhasa apso","liger","lightning bug","limpet","lion","lionfish","little owl","little penguin","lizard","llama","lobster","locust","loggerhead turtle","longhorn","loon","louse","lynx"]},	
		{letter: "M", 
		animals:["macaw","macaroni penguin","macaque","mackerel","maggot","magpie","maine coon","maltese","mallard","mamba","mammoth","manatee","mandrill","manta ray","mantis shrimp","manx cat","marmot","marmoset","mastiff","mastodon","mayfly","meerkat","millipede","mink","minke whale","minnow","mite","mockingbird","mole","monarch butterfly","mongoose","monkey","monkfish","monitor lizard","moose","mosquito","moth","mountain goat","mountain gorilla","mountain lion","mouse","mule","mule deer","mullet","muskrat","mustang","mussel","mute swan"]},				
		{letter: "O", 
		animals:["ocelot","octopus","okapi","old english sheepdog","opossum","orangutan","orca","oriole","oryx","osprey","ostrich","otter","owl","ox","oyster","oystercatcher"]},		
		{letter: "P", 
		animals:["paddlefish","panda","pangolin","panther","parakeet","parrot","partridge","peacock","pekingese","pelican","penguin","perch","peregrine falcon","persian cat","pheasant","pig","pigeon","pika","pike","pine marten","piranha","platypus","plover","pointer","polar bear","polecat","polliwog","pomeranian","pony","poodle","porcupine","porpoise","portuguese man of war","possum","prairie dog","prawn","praying mantis","pronghorn","pterodactyl","pufferfish","puffin","pug","pup","puppy","puma","pygmy hippo","python"]},			
		{letter: "R", 
		animals:["rabbit","raccoon","rainbow trout","ram","rat","rattlesnake","raven","razor clam","razorback","red admiral","red fox","red panda","red snapper","red squirrel","red wolf","reindeer","retriever","rhinoceros","rhinoceros beetle","rhodesian ridgeback","ringtail","river dolphin","roach","road runner","robin","rockfish","rockhopper penguin","roe deer","rook","rooster","rottweiler"]},		
		{letter: "S", 
		animals:["saber toothed tiger","sable","saint bernard","salamander","salmon","sand dollar","sandhill crane","sandpiper","sardine","sausage dog","scallop","schnauzer","scorpion","scottish terrier","screech owl","sea anemone","seabass","sea cucumber","sea lion","sea otter","sea slug","sea urchin","seagull","seahorse","sea turtle","seal","serval cat","setter","shark","sheep","shetland pony","shih tzu","shrew","shrimp","siamese cat","siberian husky","siberian tiger","sidewinder","silkworm","silverback gorilla","silverfish","skunk","sloth","slow worm","slug","snail","snake","snapping turtle","snow crab","snow goose","snow leopard","sole","sparrow","spectacled bear","sperm whale","spider","spider monkey","sponge","spaniel","squid","squirrel","squirrel monkey","staffordshire bull terrier","starfish","starling","stegosaurus","stick insect","stinkbug","stingray","stoat","stork","sturgeon","sun bear","swallow","swan","swift","swordfish"]},		
		{letter: "T", 
		animals:["tadpole","tapeworm","tapir","tarantula","tasmanian devil","tawny owl","termite","tern","terrapin","terrier","texas longhorn","2 toed sloth","thrasher","3 toed sloth","thrush","tibetan mastiff","tick","tiger","tigon","tiger shark","timberwolf","toad","tomcat","tortoise","toucan","tree frog","triceratops","trout","true owl","trumpeter swan","tsetse fly","tuna","turbot","turkey","turtle","tyrannosaurus rex"]},			
		{letter: "V", 
		animals:["vampire bat","vampire squid","velociraptor","viper","vixen","vole","vulture"]},
		{letter: "W",
		animals:["wallaby","walrus","warbler","warthog","wasp","water buffalo","weasel","weevil","whippoorwill","whelk","west highland terrier","whale","whale shark","whippet","white rhinoceros","white tiger","whitetail deer","wild boar","wildcat","wildebeest","wolf","wolf spider","wolverine","wombat","woodchuck","woodlouse","woodpecker","wood pigeon","woodworm","wooly mammoth","worm","wren"]},				
		{letter: "Z", 
		animals:["zebra","zebra fish","zebra shark","zebu","zonkey","zorse"]},		
		];

	var personality = [
		{animal: "aardvark", 
		phrase:"The aardvark is always the first animal in the dictionary! "},
		{animal: "albatross", 
		phrase:"You don't want one of those around your neck! "},
		{animal: "avocet", 
		phrase:"The avocet is the emblem of the Royal Society for the Protection of Birds! "},
		{animal: "bactrian camel", 
		phrase:"The bactrian camel has 2 humps! "},
		{animal: "bear", 
		phrase:"Hey bear Hey bear! "},
		{animal: "bee", 
		phrase:"Did you know that bees brush their hair with a honey comb! "},			
		{animal: "catfish", 
		phrase:"Caught Mr Catfish by the snout and turned Mr Catfish wrong side out! "},		
		{animal: "camel", 
		phrase:"A camel with two humps is called a bactrian camel. An easy way to remember this is that bactrian starts with the letter B, and B is number two in the alphabet! "},
		{animal: "chihuahua", 
		phrase:"The chihuahua is the smallest breed of dog and is named for the state of Chihuahua in Mexico! "},
		{animal: "electric eel", 
		phrase:"What a shocking creature! "},	
		{animal: "ermine", 
		phrase:"Ermine is another name for a stoat, especially when the stoat has its white winter coat! "},	
		{animal: "dromedary camel", 
		phrase:"The dromedary camel has 1 hump! "},
		{animal: "garter snake", 
		phrase:"The garter snake is also known as the garden snake, or gardener snake. "},		
		{animal: "giraffe", 
		phrase:"Ooooo! You stuck your neck out on that one! "},
		{animal: "glow worm", 
		phrase:"I wish I was a glow worm as a glow worms never glum, its hard to be down hearted when the sun shines out your bum! "},				
		{animal: "grizzly bear", 
		phrase:"Hey bear Hey bear! "},
		{animal: "hoot owl", 
		phrase:"The hoot owl is also known as the horned owl. "},
		{animal: "horned lizard", 
		phrase:"The horned lizard is also known as the horny toad, or the horned frog, although they are neither toads nor frogs. "},
		{animal: "humans", 
		phrase:"Humans are my favourite animal! "},
		{animal: "jellyfish", 
		phrase:"The jellyfish is not made of jelly and is not a fish! "},
		{animal: "killer whale", 
		phrase:"The killer whale is also known as the orca! "},		
		{animal: "kinkajou", 
		phrase:"The kinkajou is sometimes called the honey bear, even though it is not a bear. "},			
		{animal: "kitten", 
		phrase:"Kitten is the name for a baby cat, but also the name for a baby rabbit, and also the name for a baby rat! "},	
		{animal: "koala", 
		phrase:"Koalas are not bears, they are arboreal herbivorous marsupials! "},	
		{animal: "ladybird", 
		phrase:"In North America the ladybird is called the ladybug! "},
		{animal: "lamprey", 
		phrase:"King Henry the first of england, died by eating too many lampreys. "},		
		{animal: "leopard", 
		phrase:"Well spotted! "},
		{animal: "liger", 
		phrase:"The liger is a cross between a male lion and a female tiger. "},
		{animal: "lobster", 
		phrase:"Mmmm! lobster, my favourite! "},
		{animal: "mole", 
		phrase:"The English theologian William Buckland, who claimed to have eaten his way through most of the animal kingdom, said that mole meat tasted vile! "},
		{animal: "mouse", 
		phrase:"Theres a moose loose aboote this hoose! "},
		{animal: "parrot", 
		phrase:"Whose a pretty boy then? "},
		{animal: "road runner", 
		phrase:"Beep Beep! "},
		{animal: "saber toothed tiger", 
		phrase:"Saber toothed tigers became extinct around 12000 years ago. "},
		{animal: "sea cucumber", 
		phrase:"When threatened, sea cucumbers jettison some of their internal organs. The missing body parts are quickly regenerated! "},
		{animal: "shark", 
		phrase:"In my experience sharks are best avoided, especially loan sharks! "},
		{animal: "spider", 
		phrase:"Spiders are not insects, they are arachnids. Other arachnids include scorpions, ticks and mites. "},
		{animal: "sturgeon", 
		phrase:"Sturgeons can be harvested for their roe, which is sold as caviar. "},
		{animal: "swan", 
		phrase:"In the UK, the mute swan is protected by the queen and it is a criminal offence to harm one. "},
		{animal: "sun bear", 
		phrase:"The sun bear is sometimes called the honey bear. "},	
		{animal: "tigon", 
		phrase:"The tigon is a cross between a male tiger and a female lion. "},
		{animal: "vulture", 
		phrase:"Keep calm and carrion! "},
		{animal: "wasp", 
		phrase:"That was a stinging response! "},	
		{animal: "woodchuck", 
		phrase:"How much wood could a woodchuck chuck if a woodchuck could chuck wood, As much wood as a woodchuck could chuck, if a woodchuck could chuck wood. "},
		{animal: "woodpecker", 
		phrase:"Rat a tat tat! "},
		{animal: "wooly mammoth", 
		phrase:"The wooly mammoth died out thousands of years ago, but their frozen carcasses have been found in Siberia and Alaska. "},
		{animal: "zonkey", 
		phrase:"Is it a zebra? Is it a donkey? No, it's a zonkey! "},
		{animal: "zorse", 
		phrase:"Is it a zebra? Is it a horse? No, it's a zorse! "}
		];
		
	var numberOfLetters = animalAnswers.length;		
		
	if (justLaunched === true) { var letterOfAlphabet = (Math.floor(Math.random() * numberOfLetters))}
		else {
			var letterOfAlphabet = (session.attributes.letterOfAlphabet)+1;
			if (letterOfAlphabet == numberOfLetters) {letterOfAlphabet=0}
		}

	console.log("letterOfAlphabet :" + letterOfAlphabet);	
		
	var doneAlexa = [],
		sessionAttributes = {},
		shouldEndSession = false,	
		letter = (animalAnswers[letterOfAlphabet].letter),
		free = (animalAnswers[letterOfAlphabet].animals),
		totalNumberAnswers = free.length,
		repromptText = 'If you dont answer within the next few seconds the game will time out. Last chance, name an animal starting with the letter '+ letter + '. ';

	// Get Alexa guess, remove from list of free answers and add to Alexa guesses array.
	var alexaGuess = (free[Math.floor(Math.random() * free.length)]);
	free.splice(free.indexOf(alexaGuess), 1);
	doneAlexa.push(alexaGuess);		
		
	var speechOutput = 'Let\'s play Animal Letters. The letter of the alphabet is '+ letter + '. I\'ll start. My guess is, ' + alexaGuess +'. Its your turn, name an animal starting with the letter '+ letter + '. ',
		cardOutput = 'The animal Alexa guessed was: ' + alexaGuess;
		
    sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": repromptText,
		"free": free,
		"personality" : personality,
		"letter": letter,
		"letterOfAlphabet": letterOfAlphabet,
		"doneMe": [],
		"doneAlexa": doneAlexa,
        "score": 0,
		"totalNumberAnswers": totalNumberAnswers,
		"userPromptedForAnotherGame": false
    };
    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, cardOutput, speechOutput, repromptText, shouldEndSession));
}

function handleAnswerRequest(intent, session, callback) {

	var free = session.attributes.free,
				personality = session.attributes.personality,
				letter = session.attributes.letter,
				letterOfAlphabet = session.attributes.letterOfAlphabet,
				doneMe = session.attributes.doneMe,
				doneAlexa = session.attributes.doneAlexa,
				currentScore = parseInt(session.attributes.score),
				totalNumberAnswers = session.attributes.totalNumberAnswers,
				myGuess ="",
				alexaGuess ="",
				personalityPhrase = "",
				userPromptedForAnotherGame = session.attributes.userPromptedForAnotherGame,
				repromptText = 'If you dont answer within the next few seconds the game will time out. Last chance, name an animal starting with the letter '+ letter + '. ',
				speechOutput = "",
				cardOutput = "",
				sessionAttributes = {},
				gameInProgress = session.attributes;

				console.log("intent name is: " + intent.name);
				
    if (!gameInProgress) {
        // If the user responded with an answer but there is no game in progress, ask the user
        // if they want to start a new game. Set a flag to track that we've prompted the user.
        sessionAttributes.userPromptedToContinue = true;
        speechOutput = 'There is no game in progress. Do you want to start a new game? ';
        callback(sessionAttributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
    } 
	
	else if (intent.name === "DontKnowIntent") {

		if (free.length == 1) {
			speechOutput += 'Hard luck, you were so close. I only had 1 more animal beginning with the letter '+ letter + ' on my list. You could have had ' + free + '. '			
			cardOutput = "You could have had " + free}
		else {
			speechOutput += 'Hard luck. You could have had ' + free[0] + ', or ' + free[free.length-1] + '. '			
			cardOutput = 'Hard luck. You could have had ' + free[0] + ' or ' + free[free.length-1] + '. '}
		
		var wordAnswer = getWordAnswer (currentScore);
		speechOutput += 'You got, ' + currentScore.toString() + wordAnswer + '. ';
		
		if (currentScore >= 20) {
			var lastAnswer = doneMe.pop();
			speechOutput += 'Hoot hoot, what an incredible score! You guessed ' + doneMe.join() + ', and, ' + lastAnswer + ', you must be a zoologist! ' }			
		else if (currentScore >= 10) {
			var lastAnswer = doneMe.pop();				
			speechOutput += 'Woof woof, great score! You guessed ' + doneMe.join() + ', and, ' + lastAnswer + '. ' }
		else if (currentScore >= 5) {
			var lastAnswer = doneMe.pop();	
			speechOutput += 'Meow meow, good score! You guessed ' + doneMe.join() + ', and, ' + lastAnswer + '. '}
		
		speechOutput += 'Would you like to have another game? ';
		repromptText = 'Would you like to have another game? ';				
		// Set a flag to track that we're prompting to start a new game.
		session.attributes.userPromptedForAnotherGame = true;
		
        callback(session.attributes,
            buildSpeechletResponse(CARD_TITLE, cardOutput, speechOutput, repromptText, false));
    } 
	
	else if (intent.name === "AMAZON.YesIntent") {

		if (free.length == 1) {
			speechOutput += 'Hard luck. You said yes. Yes is not an animal. You could have had ' + free + '. '			
			cardOutput = "You could have had " + free}
		else {
			speechOutput += 'Hard luck. You said yes. Yes is not an animal. You could have had ' + free[0] + ', or ' + free[free.length-1] + '. '			
			cardOutput = 'Hard luck. You could have had ' + free[0] + ' or ' + free[free.length-1] + '. '}
		
		var wordAnswer = getWordAnswer (currentScore);
		speechOutput += 'You got, ' + currentScore.toString() + wordAnswer + '. ';

		if (currentScore >= 20) {
			var lastAnswer = doneMe.pop();
			speechOutput += 'Hoot hoot, what an incredible score! You guessed ' + doneMe.join() + ', and, ' + lastAnswer + ', you must be a zoologist! ' }			
		else if (currentScore >= 10) {
			var lastAnswer = doneMe.pop();				
			speechOutput += 'Woof woof, great score! You guessed ' + doneMe.join() + ', and, ' + lastAnswer + '. ' }
		else if (currentScore >= 5) {
			var lastAnswer = doneMe.pop();	
			speechOutput += 'Meow meow, good score! You guessed ' + doneMe.join() + ', and, ' + lastAnswer + '. '}		
		
		speechOutput += 'Would you like to have another game? ';
		repromptText = 'Would you like to have another game? ';				
		// Set a flag to track that we're prompting to start a new game.
		session.attributes.userPromptedForAnotherGame = true;
		
        callback(session.attributes,
            buildSpeechletResponse(CARD_TITLE, cardOutput, speechOutput, repromptText, false));
    } 

	else if (intent.name === "AMAZON.NoIntent") {

		if (free.length == 1) {
			speechOutput += 'Hard luck. You said no. No is not an animal. You could have had ' + free + '. '			
			cardOutput = "You could have had " + free}
		else {
			speechOutput += 'Hard luck. You said no. No is not an animal. You could have had ' + free[0] + ', or ' + free[free.length-1] + '. '
			cardOutput = 'Hard luck. You could have had ' + free[0] + ' or ' + free[free.length-1] + '. '}
		
		var wordAnswer = getWordAnswer (currentScore);
		speechOutput += 'You got, ' + currentScore.toString() + wordAnswer + '. ';

		if (currentScore >= 20) {
			var lastAnswer = doneMe.pop();
			speechOutput += 'Hoot hoot, what an incredible score! You guessed ' + doneMe.join() + ', and, ' + lastAnswer + ', you must be a zoologist! ' }			
		else if (currentScore >= 10) {
			var lastAnswer = doneMe.pop();				
			speechOutput += 'Woof woof, great score! You guessed ' + doneMe.join() + ', and, ' + lastAnswer + '. ' }
		else if (currentScore >= 5) {
			var lastAnswer = doneMe.pop();	
			speechOutput += 'Meow meow, good score! You guessed ' + doneMe.join() + ', and, ' + lastAnswer + '. '}

		speechOutput += 'Would you like to have another game? ';
		repromptText = 'Would you like to have another game? ';				
		// Set a flag to track that we're prompting to start a new game.
		session.attributes.userPromptedForAnotherGame = true;
		
        callback(session.attributes,
            buildSpeechletResponse(CARD_TITLE, cardOutput, speechOutput, repromptText, false));
    } 
	
	else {
				
		myGuess = intent.slots.Answer.value;
		if (typeof myGuess != 'undefined') {
			myGuess = myGuess.toLowerCase()
			if (myGuess == 'bactrian') {myGuess = 'bactrian camel'}		
			if (myGuess == 'boa') {myGuess = 'boa constrictor'}					
			if (myGuess == 'brown bear') {myGuess = 'bear'}			
			if (myGuess == 'black bear') {myGuess = 'bear'}			
			if (myGuess == 'bighorn') {myGuess = 'bighorn sheep'}
			if (myGuess == 'budgerigar') {myGuess = 'budgie'}			
			if (myGuess == 'c turtle') {myGuess = 'sea turtle'}
			if (myGuess == 'chick') {myGuess = 'chicken'}	
			if (myGuess == 'cock') {myGuess = 'cockerel'}	
			if (myGuess == 'copperhead') {myGuess = 'copperhead snake'}	
			if (myGuess == 'cottonmouth') {myGuess = 'cottonmouth snake'}	
			if (myGuess == 'chupacabras') {myGuess = 'chupacabra'}
			if (myGuess == 'crawfish') {myGuess = 'crayfish'}
			if (myGuess == 'crawdad') {myGuess = 'crayfish'}			
			if (myGuess == 'doberman') {myGuess = 'doberman pinscher'}
			if (myGuess == 'dodo bird') {myGuess = 'dodo'}
			if (myGuess == 'dromedary') {myGuess = 'dromedary camel'}	
			if (myGuess == 'duckling') {myGuess = 'duck'}				
			if (myGuess == 'fennec fox') {myGuess = 'fox'}				
			if (myGuess == 'gander') {myGuess = 'goose'}				
			if (myGuess == 'garden snake') {myGuess = 'garter snake'}				
			if (myGuess == 'gardener snake') {myGuess = 'garter snake'}	
			if (myGuess == 'galapagos giant tortoise') {myGuess = 'giant tortoise'}
			if (myGuess == 'galápagos giant tortoise') {myGuess = 'giant tortoise'}			
			if (myGuess == 'gisele') {myGuess = 'gazelle'}		
			if (myGuess == 'gosling') {myGuess = 'goose'}		
			if (myGuess == 'hammerhead') {myGuess = 'hammerhead shark'}
			if (myGuess == 'hammer head') {myGuess = 'hammerhead shark'}
			if (myGuess == 'hawaiian honeycreeper') {myGuess = 'honeycreeper'}			
			if (myGuess == 'hippo') {myGuess = 'hippopotamus'}
			if (myGuess == 'horny toad') {myGuess = 'horned lizard'}
			if (myGuess == 'horned frog') {myGuess = 'horned lizard'}	
			if (myGuess == 'horned owl') {myGuess = 'hoot owl'}
			if (myGuess == 'hound dog') {myGuess = 'hound'}					
			if (myGuess == 'human') {myGuess = 'humans'}
			if (myGuess == 'human being') {myGuess = 'humans'}
			if (myGuess == 'human beings') {myGuess = 'humans'}
			if (myGuess == 'jack russell terrier') {myGuess = 'jack russell'}			
			if (myGuess == 'jaybird') {myGuess = 'jay'}					
			if (myGuess == 'june bug') {myGuess = 'junebug'}		
			if (myGuess == 'killer bees') {myGuess = 'killer bee'}				
			if (myGuess == 'king fisher') {myGuess = 'kingfisher'}			
			if (myGuess == 'koala bear') {myGuess = 'koala'}
			if (myGuess == 'labrador retriever') {myGuess = 'labrador'}
			if (myGuess == 'labradoodle') {myGuess = 'labra doodle'}
			if (myGuess == 'lice') {myGuess = 'louse'}
			if (myGuess == 'lioness') {myGuess = 'lion'}			
			if (myGuess == 'loggerhead sea turtle') {myGuess = 'loggerhead turtle'}
			if (myGuess == 'loggerhead') {myGuess = 'loggerhead turtle'}
			if (myGuess == 'logger head') {myGuess = 'loggerhead turtle'}
			if (myGuess == 'mallard duck') {myGuess = 'mallard'}
			if (myGuess == 'mice') {myGuess = 'mouse'}
			if (myGuess == 'monarch') {myGuess = 'monarch butterfly'}			
			if (myGuess == 'orang utan') {myGuess = 'orangutan'}				
			if (myGuess == 'orca whale') {myGuess = 'orca'}		
			if (myGuess == 'oxen') {myGuess = 'ox'}			
			if (myGuess == 'panda bear') {myGuess = 'panda'}		
			if (myGuess == 'passenger pigeon') {myGuess = 'pigeon'}		
			if (myGuess == 'piglet') {myGuess = 'pig'}			
			if (myGuess == 'pygmy hippopotamus') {myGuess = 'pygmy hippo'}
			if (myGuess == 'red admiral butterfly') {myGuess = 'red admiral'}		
			if (myGuess == 'rhino') {myGuess = 'rhinoceros'}			
			if (myGuess == 'rockhopper') {myGuess = 'rockhopper penguin'}	
			if (myGuess == 'saber toothed cat') {myGuess = 'saber toothed tiger'}				
			if (myGuess == 'scottie') {myGuess = 'scottish terrier'}
			if (myGuess == 'serpent') {myGuess = 'snake'}
			if (myGuess == 'serval') {myGuess = 'serval cat'}
			if (myGuess == 'silverback') {myGuess = 'silverback gorilla'}
			if (myGuess == 'sidewinder snake') {myGuess = 'sidewinder'}			
			if (myGuess == 'springer spaniel') {myGuess = 'spaniel'}
			if (myGuess == 'tuna fish') {myGuess = 'tuna'}			
			if (myGuess == 'tyrannosaurus') {myGuess = 'tyrannosaurus rex'}
			if (myGuess == 't. rex') {myGuess = 'tyrannosaurus rex'}
			if (myGuess == 'westie') {myGuess = 'west highland terrier'}			
			if (myGuess == 'west highland white terrier') {myGuess = 'west highland terrier'}	
			if (myGuess == 'white rhino') {myGuess = 'white rhinoceros'}
			if (myGuess == 'whitetail') {myGuess = 'whitetail deer'}
			if (myGuess == 'zebrafish') {myGuess = 'zebra fish'}			
			}			
			
		if (free.indexOf(myGuess) == -1) {var isGuessTrue = false}
		else {var isGuessTrue = true}

		if (isGuessTrue === true) {

		currentScore++;

		// search if there is a personality phrase associated with this guess
		for(var i=0; i<personality.length; i++) {if ((personality[i].animal) ==myGuess) { personalityPhrase = (personality[i].phrase) + '. '}};
		
		// Remove guess from list of free answers and add to Alexa guesses array.
		free.splice(free.indexOf(myGuess), 1);
		doneMe.push(myGuess);

		speechOutput = "Well done, " + myGuess + " is a correct answer! ";
		speechOutput += personalityPhrase;
		
		var dino =["allosaurus","apatosaurus","brontosaurus","pterodactyl","stegosaurus","triceratops","tyrannosaurus rex"];
		if (dino.indexOf(myGuess) !== -1) {speechOutput += 'Give me a D, give me an I, give me an N, give me an O, dinosaur dinosaur dinosaur! '}		
		
			if ((doneAlexa.length + doneMe.length) == totalNumberAnswers) {
				speechOutput += 'Congratulations, you win, I can\'t think of any more animals starting with the letter ' + letter +'. ';
				var wordAnswer = getWordAnswer (currentScore);
				speechOutput += 'You got, ' + currentScore.toString() + wordAnswer;

				var lastAnswer = doneMe.pop();	
				speechOutput += 'You guessed ' + doneMe.join() + ', and, ' + lastAnswer + '. ';
				
				speechOutput += 'Would you like to have another game? ';
				repromptText = 'Would you like to have another game? ';				
				// Set a flag to track that we're prompting to start a new game.
				userPromptedForAnotherGame = true;
				cardOutput = 'The animal you guessed was: ' + myGuess + '. \n \n Congratulations you win - I can\'t think of any more animals!';
			}
			else {
				alexaGuess = (free[Math.floor(Math.random() * free.length)]);
				free.splice(free.indexOf(alexaGuess), 1);
				doneAlexa.push(alexaGuess);
				speechOutput += 'My guess is, ' + alexaGuess +'. ';
					if ((doneAlexa.length + doneMe.length) == totalNumberAnswers) {
					speechOutput += 'The game is a draw. Well done. There are no more animals starting with the letter ' + letter + ' on my list. '
					var wordAnswer = getWordAnswer (currentScore);					
					speechOutput += 'You got, ' + currentScore.toString() +  wordAnswer;

					var lastAnswer = doneMe.pop();	
					speechOutput += 'You guessed ' + doneMe.join() + ', and, ' + lastAnswer + '. ';					
					
					speechOutput += 'Would you like to have another game? ';
					repromptText = 'Would you like to have another game? ';		
					// Set a flag to track that we're prompting to start a new game.
					userPromptedForAnotherGame = true;
					cardOutput = 'The animal you guessed was: ' + myGuess + '. \n \n The animal Alexa guessed was: ' + alexaGuess +'. \n \n Alexa has no record of any more animals starting with the letter ' + letter +'. ';
					}
					else {
				speechOutput += 'Its your turn, name an animal starting with the letter ' + letter + '. ';
				cardOutput = 'The animal you guessed was: ' + myGuess + '. \n \n The animal Alexa guessed was: ' + alexaGuess + '. ';
					}
				}
			}
		else {

			console.log("               ");
			console.log("*** WRONG GUESS: "+myGuess);
			console.log("               ");
			
			if (typeof myGuess === 'undefined') {speechOutput += 'Commiserations, you did not give an answer. '}
			
			else {
			
			if (doneMe.indexOf(myGuess) !== -1) {speechOutput += 'Commiserations, you\'ve already said ' + myGuess + '. '}
			else if (doneAlexa.indexOf(myGuess) !== -1) {speechOutput += 'Commiserations, I\'ve already said ' + myGuess + '. '}
			else 
			{speechOutput += 'Commiserations, ' + myGuess + ' is a wrong answer! '}
		
			var myth =["basilisk","bigfoot","centaur","cheshire cat","chupacabra","dragon","elf","fairy","goblin","godzilla","griffin","hippogriff","king kong","leprechaun","loch ness monster","mermaid","minotaur","pegasus","pixie","phoenix","sasquatch","sphinx","troll","vampire","werewolf"];
			var family =["animal","amphibian","arachnid","beast","canine","cattle","creature","crustacean","dinosaur","equine","feline","mammal","marsupial","mollusc","raptor","reptile","rodent","shellfish","songbird","vermin"];
			var starwars =["ewok","jar jar binks","tusken raider","womp rat","wookiee"];
			var ring =["gollum","hobbit"];
			var cute =["beastie","bunny","bunny rabbit","creepy crawly","kitty","pussy","pussycat"];
			var cartoon =["bambi","bugs bunny","danger mouse","donald duck","dory","goofy","gummy bear","mickey mouse","roger rabbit","scooby doo","wiley coyote"];
			
			if (myGuess == 'bacteria') {speechOutput += 'Bacteria are not members of the animal kingdom. '}
			else if (myGuess == 'virus') {speechOutput += 'Viruses are not members of the animal kingdom. '}
			else if (myGuess == 'easter bunny') {speechOutput += 'Hoppy easter to you! '}			
			else if (myGuess == 'jackalope') {speechOutput += 'There aint no such thing as a jackalope. '}
			else if (myGuess == 'roadkill') {speechOutput += 'One for the pot, but I only accept living animals in this game. '}
			else if (myGuess == 'jayhawk') {speechOutput += 'Toto, I\'ve a feeling we\'re not in Kansas anymore. '}
			else if (myGuess == 'pokémon') {speechOutput += 'There are no pokémon to be caught in this game. '}			
			else if (myGuess == 'hello') {speechOutput += 'Hello to you too. Delighted to make your acquaintance. '}	
			else if (myGuess == 'gruffalo') {speechOutput += 'Silly you, don\'t you know? There\'s no such thing as a gruffalo! '}	
			else if (myGuess == 'jitterbug') {speechOutput += 'This is no time for dancing! '}			
			else if (myGuess == 'blah blah') {speechOutput += 'Blah blah to you too. '}		
			else if (myGuess == 'blah blah blah') {speechOutput += 'Blah blah blah to you too. '}	
			else if (myGuess == 'um') {speechOutput += 'There\'s no time for umming and ahing in this game. '}	
			else if (myGuess == 'snoop dogg') {speechOutput += 'You might not have a car or a big gold chain, stay true to yourself and things will change. '}				
			else if (myGuess == 'venus flytrap') {speechOutput += 'The venus flytrap is a carnivorous plant, not an animal. '}				
			else if (myGuess == 'woof woof') {speechOutput += 'Woof woof to you too. '}	
			else if (myGuess == 'jabberwocky') {speechOutput += 'Such nonsense! Beware the Jabberwock my son, The jaws that bite the claws that catch, Beware the Jubjub bird and shun, The frumious Bandersnatch! '}	  
			else if (myth.indexOf(myGuess) !== -1) {speechOutput += 'I love fantastic beasts, but only animals from the real world are allowed in this game! '}	
			else if (family.indexOf(myGuess) !== -1) {speechOutput += 'You need to be more precise, next time give me a specific type of '+ myGuess +'. '}
			else if (starwars.indexOf(myGuess) !== -1) {speechOutput += 'No animals from a galaxy far far away are allowed in this game! '}	
			else if (ring.indexOf(myGuess) !== -1) {speechOutput += 'This isn\'t middle earth, such an answer shall not pass. '}
			else if (cartoon.indexOf(myGuess) !== -1) {speechOutput += 'There are no cartoon animals allowed in this game. '}
			else if (cute.indexOf(myGuess) !== -1) {speechOutput += 'Animal letters is a very, very serious game, so no cute animal names are allowed! '}
			else if ((letter =='K') && (myGuess.charAt(0) == 'c')) {speechOutput += myGuess + ' starts with the letter c, not the letter k. '}
			else if ((letter =='C') && (myGuess.charAt(0) == 'k')) {speechOutput += myGuess + ' starts with the letter k, not the letter c. '}
			else if ((letter =='E') && (myGuess.charAt(0) == 'i')) {speechOutput += myGuess + ' starts with the letter i, not the letter e. '}			
			else if ((letter =='T') && (myGuess == 'pterodactyl')) {speechOutput += ' Pterodactyl starts with a silent letter p, not the letter t. '}			
			else if ((letter =='R') && (myGuess == 'wren')) {speechOutput += ' Wren starts with the letter w, not the letter r. '}	
			}
					
			if (free.length == 1) {speechOutput += 'Oh, so close. I only had 1 more animal beginning with the letter '+ letter + ' on my list. You could have had, ' + free + '. '
			cardOutput = 'Wrong answer, you could have had ' + free + '. '}
			else {
			speechOutput += 'You could have had ' + free[0] + ', or ' + free[free.length-1] + '. '}
			var wordAnswer = getWordAnswer (currentScore);
			speechOutput += 'You got, ' + currentScore.toString() +  wordAnswer;

			if (currentScore >= 20) {
				var lastAnswer = doneMe.pop();
				speechOutput += 'Hoot hoot, what an incredible score! You guessed ' + doneMe.join() + ', and, ' + lastAnswer + ', you must be a zoologist! ' }			
			else if (currentScore >= 10) {
				var lastAnswer = doneMe.pop();				
				speechOutput += 'Woof woof, great score! You guessed ' + doneMe.join() + ', and, ' + lastAnswer + '. ' }
			else if (currentScore >= 5) {
				var lastAnswer = doneMe.pop();	
				speechOutput += 'Meow meow, good score! You guessed ' + doneMe.join() + ', and, ' + lastAnswer + '. '}
			
			speechOutput += 'Would you like to have another game? ';
			repromptText = 'Would you like to have another game? ';		
			// Set a flag to track that we're prompting to start a new game.
			userPromptedForAnotherGame = true;
			cardOutput = 'Wrong answer, you could have had ' + free[0] + ' or ' + free[free.length-1] + '. '
			}
			
        sessionAttributes = {
             "speechOutput": speechOutput,
             "repromptText": repromptText,
			 "free": free,
			 "personality" : personality,
			 "letter": letter,
			 "letterOfAlphabet": letterOfAlphabet,
			 "doneMe": doneMe,
			 "doneAlexa": doneAlexa,
			 "score": currentScore,
			 "totalNumberAnswers": totalNumberAnswers,
			 "userPromptedForAnotherGame": userPromptedForAnotherGame
		 };
		
            callback(sessionAttributes,
                buildSpeechletResponse(CARD_TITLE, cardOutput, speechOutput, repromptText, false));
        }
    }

function handleRepeatRequest(intent, session, callback) {
    // Repeat the previous speechOutput and repromptText from the session attributes if available
    // else start a new game session
    if (!session.attributes || !session.attributes.speechOutput) {
        getWelcomeResponse(false,session,callback);
    } else {
        callback(session.attributes,
            buildSpeechletResponseWithoutCard(session.attributes.speechOutput, session.attributes.repromptText, false));
    }
}

function handleGetHelpRequest(intent, session, callback) {
    // Provide a help prompt for the user, explaining how the game is played. Then, continue the game
    // if there is one in progress, or provide the option to start another one.
    
    // Ensure that session.attributes has been initialized
    if (!session.attributes) {
        session.attributes = {};
    }

    // Set a flag to track that we're in the Help state.
    session.attributes.userPromptedToContinue = true;

    // Do not edit the help dialogue. This has been created by the Alexa team to demonstrate best practices.

    var speechOutput = "This game is called Animal Letters. " 
		+ "We will take turns guessing the names of animals beginning with a letter of the alphabet that I randomly select. "
		+ "I always take the first guess. "
		+ "Some letters have more animals than others. "
        + "You can restart an existing game by saying, Start New Game. "
        + "Would you like to keep playing?",
        repromptText = "Would you like to keep playing? ";
        var shouldEndSession = false;
    callback(session.attributes,
        buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession));
}

function handleFinishSessionRequest(intent, session, callback) {
    // End the session with a "Good bye!" if the user wants to quit the game
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Good bye!", "", true));
}

// ------- Helper functions to build responses -------


function buildSpeechletResponse(title, cardOutput, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: cardOutput
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
