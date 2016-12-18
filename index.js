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

    getWelcomeResponse(callback);
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
				getWelcomeResponse(callback);
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
        if ("AMAZON.YesIntent" === intentName) {getWelcomeResponse(callback)}
			else if ("AMAZON.StartOverIntent" === intentName) {
				getWelcomeResponse(callback);
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
			} else {handleFinishSessionRequest(intent, session, callback)
			}
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
        getWelcomeResponse(callback);
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

function getWelcomeResponse(callback) {

	var animalAnswers = [
		{letter: "A", 
		animals:["aardvark","aardwolf","abalone","adder","afghan hound","albatross","alligator","anaconda","anchovy","angelfish","anglerfish","ant","anteater","antelope","ape","aphid","arctic fox","armadillo","auk","avocet"]},
		{letter: "B", 
		animals:["baboon","bactrian camel","badger","bald eagle","bandicoot","barn owl","barnacle","barracuda","bat","beagle","bear","beaver","bedbug","bee","beetle","beluga whale","bengal tiger","bird","bird of paradise","bison","bloodhound","blue whale","bluebird","bluebottle","boa constrictor","boar","bobcat","bonobo","booby","boxer","buffalo","budgie","bulldog","bull mastiff","bull terrier","bumble bee","burmese cat","bushbaby","bustard","butterfly","buzzard"]},	
		{letter: "C", 
		animals:["canary","camel","capybara","cardinal","caribou","carp","cassowary","cat","caterpillar","catfish","centipede","chaffinch","chameleon","cheetah","chicken","chickenhawk","chihuahua","chimpanzee","chinchilla","chipmunk","cicada","civet cat","clam","clownfish","cobra","cockatiel","cockatoo","cockroach","cocker spaniel","cod","collie","coral","cormorant","cougar","cow","coyote","crab","crane","crane fly","cricket","crocodile","crow","cuckoo","cuttlefish"]},	
		{letter: "D", 
		animals:["dachshund","daddy long legs","dalmatian","deer","dingo","doberman pinscher","dodo","dog","dogfish","dolphin","donkey","dormouse","dove","dragonfly","dromedary camel","duck","duck billed platypus","dung beetle"]},	
		{letter: "E", 
		animals:["eagle","earthworm","earwig","eel","egret","electric eel","elephant","elephant seal","elk","ermine","emu"]},	
		{letter: "F", 
		animals:["falcon","ferret","firefly","fish","finch","flamingo","flatworm","flea","flounder","fly","flying fish","flying frog","flying squirrel","forky taily","fox","foxhound","frog","fruit bat","fruit fly"]},	
		{letter: "G", 
		animals:["gannett","gator","gazelle","gecko","gerbil","german shepherd","gibbon","gila monster","giraffe","glow worm","gnat","gnu","goat","goldfish","golden eagle","golden retriever","goose","gopher","gorilla","grasshopper","great dane","great white shark","greenfly","greyhound","grizzly bear","groundhog","ground squirrel","grouper","grouse","guinea pig","guineafowl","guppy"]},	
		{letter: "H", 
		animals:["haddock","hammerhead shark","hamster","hare","harrier","hawk","hedgehog","hen","hermit crab","heron","herring","highland cow","hippopotamus","hog","hornet","horse","horseshoe crab","hound","humans","hummingbird","humpback whale","husky","hyena"]},	
		{letter: "J", 
		animals:["jack russel","jackal","jackrabbit","jaguar","jay","jellyfish","jerboa"]},	
		{letter: "K", 
		animals:["kangaroo","kestrel","killer whale","king cobra","kingfisher","kite","kiwi","koala","kodiak bear","komodo dragon","kookaburra"]},	
		{letter: "L", 
		animals:["labrador","ladybird","ladybug","lamprey","lark","leech","lemming","lemur","leopard","lion","lizard","llama","lobster","locust","lynx"]},	
		{letter: "M", 
		animals:["macaw","mackerel","magpie","mamba","mammoth","manatee","mandrill","manta ray","manx cat","marmot","marmoset","mayfly","meerkat","millipede","mink","minke whale","mite","mole","mongoose","monkey","moose","mosquito","moth","mountain goat","mountain lion","mouse","mule","mule deer","mullet","mustang"]},				
		{letter: "O", 
		animals:["ocelot","octopus","old english sheepdog","opossum","orangutan","orca","oryx","osprey","ostrich","otter","owl","ox","oyster","oystercatcher"]},		
		{letter: "P", 
		animals:["panda","pangolin","panther","parakeet","parrot","partridge","peacock","pekingese","pelican","penguin","perch","peregrine falcon","persian cat","pheasant","pig","pigeon","pika","pike","pine marten","piranha","platypus","plover","pointer","polar bear","polecat","poodle","porcupine","porpoise","possum","prairie dog","prawn","praying mantis","pronghorn","puffin","pug","puma","python"]},			
		{letter: "R", 
		animals:["rabbit","raccoon","rat","rattlesnake","raven","razorback","reindeer","rhinoceros","ringtail","roach","road runner","robin","rook","rottweiler"]},		
		{letter: "S", 
		animals:["saber toothed tiger","saint bernard","salamander","salmon","sandpiper","sardine","sausage dog","scorpion","sea anemone","seabass","sea cucumber","sea lion","sea slug","sea urchin","seagull","seahorse","seal","shark","sheep","shih tzu","shrew","shrimp","siamese cat","siberian tiger","sidewinder","silkworm","skunk","sloth","slow worm","slug","snail","snake","snow leopard","sparrow","sperm whale","spider","spider monkey","sponge","springer spaniel","squid","squirrel","squirrel monkey","starfish","starling","stick insect","stinkbug","stingray","stoat","stork","sturgeon","swallow","swan","swift","swordfish"]},		
		{letter: "T", 
		animals:["tapeworm","tapir","tarantula","tasmanian devil","tawny owl","termite","tern","terrapin","3 toed sloth","thrush","tick","tiger","toad","tortoise","toucan","tree frog","trout","tuna","turbot","turkey","turtle"]},			
		{letter: "V", 
		animals:["vampire bat","vampire squid","viper","vole","vulture"]},
		{letter: "W",
		animals:["wallaby","walrus","warthog","wasp","water buffalo","weasel","weevil","whelk","west highland terrier","whale","whippet","wild boar","wildcat","wildebeest","wolf","wolverine","wombat","woodlouse","woodpecker","woodworm","wooly mammoth","worm","wren"]},				
		{letter: "Z", 
		animals:["zebra","zebu","zonkey","zorse"]},		
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
		{animal: "giraffe", 
		phrase:"Ooooo! You stuck your neck out on that one! "},
		{animal: "glow worm", 
		phrase:"I wish I was a glow worm as a glow worms never glum, its hard to be down hearted when the sun shines out your bum! "},				
		{animal: "grizzly bear", 
		phrase:"Hey bear Hey bear! "},
		{animal: "humans", 
		phrase:"Humans are my favourite animal! "},
		{animal: "jellyfish", 
		phrase:"The jellyfish is not made of jelly and is not a fish! "},
		{animal: "killer whale", 
		phrase:"The killer whale is also known as the orca! "},		
		{animal: "koala", 
		phrase:"Koalas are not bears, they are arboreal herbivorous marsupials! "},	
		{animal: "ladybird", 
		phrase:"In North America the ladybird is called the ladybug! "},
		{animal: "lamprey", 
		phrase:"King Henry the first of england, died by eating too many lampreys. "},		
		{animal: "leopard", 
		phrase:"Well spotted! "},
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
		{animal: "vulture", 
		phrase:"Keep calm and carrion! "},
		{animal: "wasp", 
		phrase:"That was a stinging response! "},	
		{animal: "woodpecker", 
		phrase:"Rat a tat tat! "},
		{animal: "wooly mammoth", 
		phrase:"The wooly mammoth died out thousands of years ago, but their frozen carcasses have been found in Siberia and Alaska. "},
		{animal: "zonkey", 
		phrase:"Is it a zebra? Is it a donkey? No, it's a zonkey! "},
		{animal: "zorse", 
		phrase:"Is it a zebra? Is it a horse? No, it's a zorse! "}
		];
		
	var numberOfLetters = animalAnswers.length,			
		letterOfAlphabet = (Math.floor(Math.random() * numberOfLetters)),
		letter = (animalAnswers[letterOfAlphabet].letter),
		free = (animalAnswers[letterOfAlphabet].animals),	
		totalNumberAnswers = free.length,
		doneAlexa = [],
		sessionAttributes = {},
		shouldEndSession = false,	
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
			speechOutput += 'Hard luck. You could have had ' + free + '. '
			cardOutput = "You could have had " + free}
		else {
			speechOutput += 'Hard luck. You could have had ' + free[0] + ', or ' + free[free.length-1] + '. '
			cardOutput = 'Hard luck. You could have had ' + free[0] + ' or ' + free[free.length-1] + '. '}
		
		var wordAnswer = getWordAnswer (currentScore);
		speechOutput += 'You got, ' + currentScore.toString() + wordAnswer + '. ';
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
		speechOutput += 'Would you like to have another game? ';
		repromptText = 'Would you like to have another game? ';				
		// Set a flag to track that we're prompting to start a new game.
		session.attributes.userPromptedForAnotherGame = true;
		
        callback(session.attributes,
            buildSpeechletResponse(CARD_TITLE, cardOutput, speechOutput, repromptText, false));
    } 
	
	else {
				
		myGuess = intent.slots.Answer.value;
		if (typeof myGuess != 'undefined') {myGuess = myGuess.toLowerCase()}
				
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

			if ((doneAlexa.length + doneMe.length) == totalNumberAnswers) {
				speechOutput += 'Congratulations, you win, I can\'t think of any more animals starting with the letter ' + letter +'. ';
				var wordAnswer = getWordAnswer (currentScore);
				speechOutput += 'You got ' + currentScore.toString() + wordAnswer;
				
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
					speechOutput += 'You got ' + currentScore.toString() +  wordAnswer;
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
			else if (doneMe.indexOf(myGuess) !== -1) {speechOutput += 'Commiserations, you\'ve already said ' + myGuess + '. '}
			else if (doneAlexa.indexOf(myGuess) !== -1) {speechOutput += 'Commiserations, I\'ve already said ' + myGuess + '. '}
			else 
			{speechOutput += 'Commiserations, ' + myGuess + ' is a wrong answer! '}
		
			var dino =["allosaurus","brontosaurus","dinosaur","diplodocus","pterodactyl","stegosaurus","triceratops","tyrannosaurus","tyrannosaurus rex","t. rex","velociraptor"];
			var myth =["basilisk","centaur","dragon","elf","fairy","goblin","griffin","halfling","hippogriff","leprechaun","loch ness monster","mermaid","pixie","sphinx","troll","werewolf"];
			var family =["amphibian","arachnid","mammal","marsupial","mollusc","reptile","shellfish"];
			var starwars =["ewok","tusken raider","womp rat","wookiee"];
			var ring =["balrog","gollum","hobbit","orc","smaug"];
			var baby =["kitten","lamb","puppy"];
			
			if (myGuess == 'bacteria') {speechOutput += 'Bacteria are not members of the animal kingdom. '}
			else if (myGuess == 'virus') {speechOutput += 'Viruses are not members of the animal kingdom. '}
			else if (myGuess == 'jackalope') {speechOutput += 'There aint no such thing as a jackalope. '}
			else if (myGuess == 'pokémon') {speechOutput += 'There are no pokémon to be caught in this game. '}			
			else if (myGuess == 'hello') {speechOutput += 'Hello to you too. Delighted to make your acquaintance. '}	
			else if (myGuess == 'gruffalo') {speechOutput += 'Silly you, don\'t you know? There\'s no such thing as a gruffalo! '}	
			else if (myGuess == 'jitterbug') {speechOutput += 'This is no time for dancing! '}	
			else if (myGuess == 'blah blah') {speechOutput += 'Blah blah to you too. '}		
			else if (myGuess == 'blah blah blah') {speechOutput += 'Blah blah blah to you too. '}	
			else if (myGuess == 'woof woof') {speechOutput += 'Woof woof to you too. '}	
			else if (myGuess == 'jabberwocky') {speechOutput += 'Such nonsense! Beware the Jabberwock my son, The jaws that bite the claws that catch, Beware the Jubjub bird and shun, The frumious Bandersnatch! '}	  
			else if (myGuess == 'koala bear') {speechOutput += 'Koalas are not bears, they are marsupials! Next time just say, Koala. '}
			else if (myGuess == 'spaniel') {speechOutput += 'Be more specific, next time try saying, springer spaniel! '}
			else if (dino.indexOf(myGuess) !== -1) {speechOutput += 'Dinosaurs are too big a subject for this game! '}		
			else if (myth.indexOf(myGuess) !== -1) {speechOutput += 'I love fantastic beasts, but only animals from the real world are allowed in this game! '}	
			else if (family.indexOf(myGuess) !== -1) {speechOutput += 'You need to be more precise, next time give me a specific type of '+ myGuess +'. '}
			else if (starwars.indexOf(myGuess) !== -1) {speechOutput += 'No animals from a galaxy far far away are allowed in this game! '}	
			else if (ring.indexOf(myGuess) !== -1) {speechOutput += 'This isn\'t middle earth, such an answer shall not pass. '}
			else if (baby.indexOf(myGuess) !== -1) {speechOutput += 'There are no baby animals in this game. '}
			else if (letter ="k" && myGuess.charAt(0) == "c") {speechOutput += myGuess + ' starts with the letter c, not the letter k. '}
			else if (letter ="c" && myGuess.charAt(0) == "k") {speechOutput += myGuess + ' starts with the letter k, not the letter c. '}
			
			if (free.length == 1) {speechOutput += 'You could have had, ' + free + '. '
			cardOutput = 'Wrong answer, you could have had ' + free + '. '}
			else {
			speechOutput += 'You could have had ' + free[0] + ', or ' + free[free.length-1] + '. '}
			var wordAnswer = getWordAnswer (currentScore);
			speechOutput += 'You got ' + currentScore.toString() +  wordAnswer;
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
        getWelcomeResponse(callback);
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
