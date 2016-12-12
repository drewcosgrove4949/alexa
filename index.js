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
    if (session.attributes && session.attributes.userPromptedForAnotherGame) {
        delete session.attributes.userPromptedForAnotherGame;
        if ("AMAZON.YesIntent" === intentName) {getWelcomeResponse(callback)}
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
		animals:["aardvark","aardwolf","adder","afghan hound","albatross","alligator","anaconda","ant","anteater","antelope","ape","aphid","arctic fox","armadillo","auk","avocet"]},
		{letter: "B", 
		animals:["baboon","badger","bandicoot","barn owl","barracuda","bat","bear","beaver","bedbug","beetle","bird","bison","bluebird","boa constrictor","bobcat","booby","buffalo","bee","budgie","butterfly","bustard","buzzard"]},	
		{letter: "C", 
		animals:["canary","camel","capybara","cassowary","cat","caterpillar","catfish","centipede","chameleon","cheetah","chicken","chihuahua","chimpanzee","chinchilla","chipmunk","cicada","clam","cobra","cockatoo","cockroach","cocker spaniel","coral","cougar","cow","coyote","crab","crane","cricket","crocodile","crow","cuckoo","cuttlefish"]},	
		{letter: "D", 
		animals:["dachshund","dalmatian","deer","dingo","doberman pinscher","dodo","dog","dogfish","dolphin","donkey","dormouse","dove","dragonfly","duck","duck billed platypus","dung beetle"]},	
		{letter: "E", 
		animals:["eagle","earwig","eel","egret","electric eel","elephant","elk","ermine","emu"]},	
		{letter: "F", 
		animals:["falcon","ferret","firefly","fish","finch","flamingo","flatworm","flea","fly","flying fish","flying frog","flying squirrel","forky taily","fox","frog"]},	
		{letter: "G", 
		animals:["gannett","gecko","gerbil","german shepherd","gibbon","gila monster","giraffe","glow worm","gnat","gnu","goat","goldfish","golden retriever","goose","gopher","gorilla","grasshopper","greenfly","greyhound","grizzly bear","groundhog","grouse","guinea pig","guppy"]},	
		{letter: "H", 
		animals:["hammerhead shark","hamster","hare","harrier","hawk","hedgehog","hen","hermit crab","highland cow","hippopotamus","hog","hornet","horse","horseshoe crab","hummingbird","hyena"]},	
		{letter: "J", 
		animals:["jack russel","jackal","jackrabbit","jaguar","jay","jellyfish","jerboa"]},	
		{letter: "K", 
		animals:["kangaroo","kestrel","killer whale","kingfisher","kite","kiwi","koala","komodo dragon","kookaburra"]},	
		{letter: "L", 
		animals:["labrador","ladybird","lark","leech","lemming","lemur","leopard","lion","lizard","llama","lobster","locust","lynx"]},	
		{letter: "M", 
		animals:["magpie","manatee","mandrill","manta ray","marmot","marmoset","mayfly","meerkat","millipede","mink","mite","mole","mongoose","monkey","moose","mosquito","moth","mountain lion","mouse","mule","mule deer"]},				
		{letter: "O", 
		animals:["ocelot","octopus","old english sheepdog","opossum","orangutan","oryx","osprey","ostrich","otter","owl","ox","oyster","oystercatcher"]},		
		{letter: "P", 
		animals:["panda","panther","parrot","partridge","peacock","pelican","penguin","pheasant","pig","pigeon","pika","pike","pine marten","piranha","platypus","polar bear","polecat","poodle","porcupine","porpoise","possum","prairie dog","prawn","praying mantis","pronghorn","puffin","puma","python"]},			
		{letter: "R", 
		animals:["rabbit","raccoon","rat","rattlesnake","raven","reindeer","rhinoceros","road runner","robin","rook","rottweiler"]},		
		{letter: "S", 
		animals:["saint bernard","salamander","salmon","scorpion","sea cucumber","sea lion","sea urchin","seagull","seahorse","seal","shark","sheep","shrew","shrimp","silkworm","skunk","sloth","slow worm","slug","snail","snake","sparrow","spider","spider monkey","sponge","squid","squirrel","squirrel monkey","starfish","starling","stick insect","stinkbug","stingray","stoat","swallow","swan","swift","swordfish"]},		
		{letter: "T", 
		animals:["tapir","tarantula","tasmanian devil","tawny owl","termite","terrapin","thrush","tick","tiger","toad","tortoise","toucan","trout","turkey","turtle"]},			
		{letter: "V", 
		animals:["vampire bat","vampire squid","viper","vole","vulture"]},
		{letter: "W",
		animals:["wallaby","walrus","warthog","wasp","water buffalo","weasel","weevil","west highland terrier","whale","whippet","wild boar","wildebeest","wolf","wolverine","wombat","woodlouse","woodpecker","worm","wren"]},				
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
		{animal: "giraffe", 
		phrase:"Ooooo! You stuck your neck out on that one! "},
		{animal: "glow worm", 
		phrase:"I wish I was a glow worm as a glow worms never glum, its hard to be down hearted when the sun shines out your bum! "},				
		{animal: "grizzly bear", 
		phrase:"Hey bear Hey bear! "},
		{animal: "jellyfish", 
		phrase:"The jellyfish is not made of jelly and is not a fish! "},
		{animal: "killer whale", 
		phrase:"The killer whale is also known as the orca! "},		
		{animal: "koala", 
		phrase:"Koalas are not bears, they are arboreal herbivorous marsupials! "},	
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
		{animal: "sea cucumber", 
		phrase:"When threatened, sea cucumbers jettison some of their internal organs. The missing body parts are quickly regenerated! "},
		{animal: "shark", 
		phrase:"In my experience sharks are best avoided, especially loan sharks! "},
		{animal: "spider", 
		phrase:"Spiders are not insects, they are arachnids. Other arachnids include scorpions, ticks and mites. "},
		{animal: "swan", 
		phrase:"In the UK, the mute swan is protected by the queen and it is a criminal offence to harm one. "},
		{animal: "vulture", 
		phrase:"Keep calm and carrion! "},
		{animal: "wasp", 
		phrase:"That was a stinging response! "},	
		{animal: "woodpecker", 
		phrase:"Rat a tat tat! "},
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
		"totalNumberAnswers": totalNumberAnswers
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
				userPromptedForAnotherGame = false,
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
			cardOutput = 'Hard luck. You could have had ' + free[0] + ' or ' + free[free.length-1] + '.'}
		
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
			cardOutput = 'Hard luck. You could have had ' + free[0] + ' or ' + free[free.length-1] + '.'}
		
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
			cardOutput = 'Hard luck. You could have had ' + free[0] + ' or ' + free[free.length-1] + '.'}
		
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
					cardOutput = 'The animal you guessed was: ' + myGuess + '. \n \n The animal Alexa guessed was: ' + alexaGuess +'. \n \n Alexa has no record of any more animals starting with the letter ' + letter +'.';
					}
					else {
				speechOutput += 'Its your turn, name an animal starting with the letter ' + letter + '. ';
				cardOutput = 'The animal you guessed was: ' + myGuess + '. \n \n The animal Alexa guessed was: ' + alexaGuess + '.';
					}
				}
			}
		else {

			if (typeof myGuess === 'undefined') {speechOutput += 'Commiserations, you did not give an answer. '}
			else if (doneMe.indexOf(myGuess) !== -1) {speechOutput += 'Commiserations, you\'ve already said ' + myGuess + '. '}
			else if (doneAlexa.indexOf(myGuess) !== -1) {speechOutput += 'Commiserations, I\'ve already said ' + myGuess + '. '}
			else 
			{speechOutput += 'Commiserations, ' + myGuess + ' is a wrong answer! '}
		
			if (free.length == 1) {speechOutput += 'You could have had, ' + free + '. '
			cardOutput = 'Wrong answer, you could have had ' + free + '.'}
			else {
			speechOutput += 'You could have had ' + free[0] + ', or ' + free[free.length-1] + '. '}
			var wordAnswer = getWordAnswer (currentScore);
			speechOutput += 'You got ' + currentScore.toString() +  wordAnswer;
			speechOutput += 'Would you like to have another game? ';
			repromptText = 'Would you like to have another game? ';		
			// Set a flag to track that we're prompting to start a new game.
			userPromptedForAnotherGame = true;
			cardOutput = 'Wrong answer, you could have had ' + free[0] + ' or ' + free[free.length-1] + '.'
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
