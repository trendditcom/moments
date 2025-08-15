# No Priors Ep. 127 | With SemiAnalysis Founder and CEO Dylan Patel
https://www.youtube.com/watch?v=vGhlJqnECd0

Dylan Patel Introduction
Hi listeners, welcome back to No Priors. Today I'm here with Dylan Patel, the chief analyst at Semi Analysis, a
leading source for anyone interested in chips and AI infrastructure. We talk about open source models, the
bottlenecks to building a data center the size of Manhattan, geopolitics, and
poker as a tell for entrepreneurship. Welcome, Dylan. Dylan, thank you so much for being here. Thank you for having me.
I've been really looking forward to this conversation. And um you're such a deep thinker about the space. And then also it's very odd you clearly have the
Dylan’s Love for Android Products
Samsung watch. Yeah. I I got the I got the Blig the laptop, the fold. Yeah. Yeah.
Tell me more. So part of the origin story is that I was moderating forms when I was a child
and my dad first Android phone was the Droid, right? Okay. And for some reason, I was obsessed with like messing with
it, like rooting it, like underclocking it, improving the battery life, all these things because when we went on a
road trip, there's nothing to do besides like mess around on this phone. So, I posted so much about Android that I
became a moderator r/android on Reddit and and like many other subreddits related to hardware and Nvidia and Intel
and all this stuff. But because of that, I've just always had Android. Now, I've had work iPhones before, but I just
really love Android. that it's like if you're going to like technology, I'm not like someone who pushes it, but like get
the best stuff. So, I have like the ultra Samsung watch, which I think looks cool, and the the foldy phone, right? It's fun. It's obviously different and
weird. No, no iMessage is is attractive. What does it dominate at? What is it better at? Um,
besides the openness of like the hackability, I don't even hack that much stuff anymore, right? It's like what do you use your phone for? I think I think the
main thing is like you can have like Slack and an email up on two different parts of your phone. I think that's probably the main thing. Or like you can
actually use like a spreadsheet on a folding phone. You cannot use a spreadsheet on a regular
phone. Okay. And that's not even an Android thing. Like Apple's folding phone next year will be able to do that just fine. And
I'll have no argument then. Yeah. But I just like it. You know, people people have their preferences. People are creatures of habit.
You got to look at the GPU purchasing forecast. Yes. On a sheet on your phone. Yes, I do. I do. No. Like it's like
someone's telling you numbers. You're like, "Wait, this is like slightly different than my number." Right. Like Okay. So, we have a week of big rumored
Predictions About OpenAI’s Open Source Model
announcements coming up. Tell me your like reaction to the OpenAI open source
model. In theory, it's going to be amazing, right? Like I assume this is releasing after it's released or
Yes. So, that's okay. The open source model is amazing, guys. Like, I think the
world is going to be really like shocked and excited. It's the first time America's had the best open source model
in six months, nine months, a year. Llama 3.1 405b was the last time we had
the best model and then Mishrol took over for a little bit if I recall correctly and then the Chinese labs have been dominating for the last like six
nine months right so it'll be interesting it'll also be funny because like the open source model probably
won't be the best for just regular chat because it is like more reasoning focused and all these things but it'll
be really good at code and so I'm excited for that yeah like tool use although that's like going to be confusing like how do you use the tools
if you don't have access to open tool use stuff, but the model is trained to do so. That'll be interesting for people
to figure out. I think the last thing is like the way they're rolling it out is really interesting. They accidentally leaked all the weights, but no one in
the open source has figured out how to actually run inference on it because there's just some weird stuff in the model with the architecture like for bit
and like the biases and all this other stuff. But what's interesting is other companies drop the model weights and say
go make your own inference implementation. But OpenAI is like actually like dropping the model weights and like all these custom kernels for
people to implement in inference. So everyone has a very optimized inference stack day one.
And they work with partners on it too. Yeah. Working with partners on this. But this is very interesting because like when Deep Seeks drops it's like well
together in Fireworks are like yeah we're the best at inference because we have all these like people who are really good at low-level coding. Whether
it be like fireworks with all their like former PyTorch meta people or together with like you know Tree Dow and all the
you know Danfu and all these like super cracked like kernel people they have like higher performance right uh but in
this case like open releasing a lot of this stuff so it's it's it's it's interesting for the inference providers too like how do they differentiate now
yeah I I mean my premise on this is um in the end a lot of the model optimization performance layer is open-
source and it's a commodity Um a and it will end up being like a fight at the
infrastructure level actually and so you know all of these inference providers like as you mentioned you know fireworks
and together and base 10 and such they they compete on both dimensions and the question is what's going to matter in the long term
why would these model level software optimizations all be open they haven't been open so far and the advancements
are so fast right like oh well I think that um a bunch of them have been partially open and I think
open AI is also pushing for them to be open as Right. Um and so I think there's a lot of force in the ecosystem to um
open source from both like the NVIDIA level up and from the model providers down. Right. And so I think today these
providers all fight on that dimension. Yeah. And they also fight on the infrastructure dimension. And I think infrastructure is going to end up being
a bigger differentiator. That makes sense. You can't open source your actual infrastructure, right? You just have to
have the network and you have to run it, right? Yeah. Yeah, that makes a lot of sense. Although like I see today the inference
like providers have such a wide variance right like the ones you mentioned are on the like the leading edge especially
like together and fireworks I think are on the leading edge of like their own custom stacks all the way down to like there's a lot of people who just take
the out-of-box open source software. Yeah, I think there's no market for that. But those guys have just Yeah, I agree. There's no market. It's like
commoditized. They have really really way worse margins than the people who are very optimized. When you see Nvidia
trying to open source all this stuff around Dynamo and and OpenAI and all these other people are trying to open source stuff, but the level of
optimizations is also like really really large like caching between turns and
caching tool use calls and all these other things. And it's not just like a single server problem like it's like the
deepseek implementation of inference is like 160 GPUs or something like that like that's over $10 million of hardware
and then that's just one replica and then you'll have a lot of replicas and you share the caching servers between them. So like seems like just the
orchestration of that but also the infrastructure of that it's a very large amount of infrastructure. I don't know that's interesting thought that that would be completely commoditized
optimization layer. Well, I think that there's optimization at the single node level and then there's like the system
software where you can like orchestrate this and and I think that owning the abstractions for it and having people
use your tools and more sophisticated teams to do that optimization is like very ugly distributed systems problem. I
think that will matter. Okay. Yeah, I I could agree with that. I could agree with that single node is not necessarily Yeah, I agree. let's move a
Implications of an American Open Source Model for the Application Ecosystem
you know out and a layer down like what does having access to an American open- source model mean or just more and more
powerful like uh open source AI models mean for the application ecosystem I mean I know like a lot of people and
some enterprises are really iffy about like using like the best open source model they're like worried it's like
there's nothing wrong with them today there's nothing in them today right you know there's the worry that one day they will how do you check
I mean you don't like you can just vibes it out like they're like competing with each other to just released as fast as possible, right? Like like Deepseek and
Moonshot and all these other you know Alibaba, etc. Like they're competing to release as fast as they can with each
other. The Alibaba teams in Singapore like I don't think that they're like putting Trojan horses in these models,
right? And like there's some interesting papers that Enthropic did on like you know trying to embed some stuff in
models and ended up like being detectable pretty easily. again like I don't know how to, you know, I'm not I'm
not too much into that space of interpretability and like eval but I just don't think that they are right.
It's just a vibes thing. But some people are worried that they could be or they're just like iffy like oh I don't want to use a Chinese model. It's like
well fine but now you're going to go use a service that is backed by a Chinese model which is fine like you know like
uh but they you know they're fine with that. They just don't want to directly use the model. I don't know. I think I think it's it's interesting for some
enterprises who are still stuck on mama, but it's mostly just really interesting because it continues to move the
commodity bar up now with this tier being open source. And sure, like
probably won't be like drastically better than Kimmy, but Kimmy is so big, it's so difficult to run, like people
aren't running it, whereas the OpenAI models is like relatively small, so you can run it without being like gigabrain
at infrastructure. you end up with that commoditizing so much more of the closed
source API market. I don't know. I think that's just going to be great for adoption, right? Like yeah, one of my um hopes is uh for our
companies that are doing more with reasoning, it is like they're still blocked on cost and latency. So this is
something that I've found very interesting is that when we we've been trying to build a lot of alternative data sources for token usage um who's
using what tokens what models where etc why and it's very clear that people aren't actually using the reasoning
models that much in API like anthropic has eclipsed open and API revenue and their API revenue is primarily not
thinking it's cloud 4 but it's not in the thinking mode you know code is code being the biggest uh use case that's
skyrocketing um and the same applies to like OpenAI and and Deepbind and and from what we see querying big users and
other ways of like scraping alternative data because the latency issues because the cost issues especially right the cost is just ridiculous
you're exactly so I guess my view is um you're not allowed to have a tech podcast without saying the words Jevans
paradox now and I I think like I I think the behavior is going to be like we see a lot of people use reasoning because
it's so much cheaper to run if you take out a big piece of the margin layer and you make it smaller and so I think like
we have a lot of companies that are at scale who are using it, but it's so expensive that they restrain themselves.
For a long time, OpenAI was charging more per token for the reasoning model, right, 01 and 03, uh, than they were for
GPD40, even though the architecture is like basically the same. It's just the weights are different. And there's like
some reason for it to be a little bit more expensive per token because the context length is on average longer. But
in general, like it made no sense for it to be like was it like 4x the cost per token? That didn't make any sense. And
then finally, they like cut it. Uh but for a long time, not only was it like way more tokens outputed, it was also a
way higher price per token even though and they were just taking that as margin because they could, right? Because they had the only thing out there.
Yeah. And then, you know, DeepSeek dropped and and An Enthropic and Google and others started releasing models and it like, you know, commoditized quite a
bit, but this is going to just like kneecap like like take cut everyone off at the hip, right? Uh and bring margins
down again. So, who has an API business, you mean? Yeah. Yeah. For API for models that aren't like like super leading edge.
Evolution of Neoclouds
What do you think uh evolves in the sort of Neocloud layer over time? It's funny. Every day we still find a
new Neocloud. Like we have like like 200 now and still every day we find new ones, right? Like
should they all exist? Obviously not, right? Like so so to some extent it depends on what the NeoCloud
business is, right? Like today it's there is quite a bit of differentiation between the Neoclouds. It's not just like buy a GPU, put it in a data center.
Otherwise, you wouldn't have some NeoClouds with like horrible utilization rate and you wouldn't have some Neoclouds who are like completely sold
out on four, five, sixyear contracts, right? Like Corweave, for example, who doesn't even quote most startups or they just give them a stupid quote because
they just like I don't want your business or like they want a long-term contract, right? Which a lot of people don't want to sign. And so like there's
quite a bit of differentiation in in financial performance of these Neil clouds, time to deploy, reliability, the
software they're putting on top, right? Like many of them can't even install slurm for you. It's like what are you doing? like and you should have some
sort of like so very low level hardware management. Yeah. Yeah. It's like very and it's like to some extent from the investor side we
see a lot more debt and equity flowing in from the commercial real estate folks as commercial real estate has been
really poor over the last couple years, few years. They've been starting to pour money into cloud space and obviously the
return profile is quite different because it's like a short-lived asset versus like a longer lived asset. But at the end of the day like these companies
they're okay with a 10 15% return on equity, right? uh and and over time that
falling that is not okay for venture capital, right? And yet a lot of these Neil clouds are backed by venture
capital. So a lot of these companies will fail either because it no longer makes sense for them to continue to get
venture funding or they end up getting out competed because they just can't get their utilization up unlike you know
some other clouds right like like the like the uh core weaves and crusos and and such of the world right so there
there's sort of like a rock and a hard place for a 100 of these Neil clouds and and there's many of them who are like oh
no I purchased these GPUs I have a loan it cost me this much and because my
utilization is here I'm like burning cash, right? And they should at the very least not be burning cash, right? And so some
of them are like, you know, they're desperate to sell the remaining GPUs, so they go out to like, you know, companies and give them insanely low deals. There
there's some startups who I really commend because they've like really figured out how to get the desperate Neoclouds to give them GPUs, but those
Neoclouds are going to go bankrupt at some point because their cash flow is worse than their debt payment. But at the end of the day, like there's going
to be a lot of consolidation. There is going to be differentiation, right? There's a lot of software today. Uh but
we have this like thing called clusterbacks where we review all the Neoclouds um and and major clouds and
it's like like actually some of these NeoClouds are better than Amazon and Google and Microsoft in terms of
software in terms of um uptime and availability or however you yeah uptime availability um reliability
network performance like there's just a variety of things that they don't have all the old baggage but the vast majority are worse and we we measure
across like you know a bunch of different metrics including the ones I mentioned and security and so on and so forth but our vision of like cluster max
is that it starts at like a really low stage today which is like does the cloud work and how long does it take the user
to like get a workload running because you have slurm installed or you have K installed and um you know your network
performance is good and your reliability is good and it's secure right like these are like table stakes like what we
consider gold or platinum tier today will be just like table stakes in like
you know six months a year a couple years there'll be a whole layer of like software on top and then it's like do
Neoclouds build this software Right. And some of them are right like together Nebius um are offering inference
services on top. Right? So they they're saying, "Hey, we actually want to provide an API endpoint, not just rent
GPUs." And core we've rumored by the information to be uh attempting to buy fireworks for the same reason, right?
Like do you move up or do you just slide down into like I'm making commercial real estate returns or you have to go
crazy, right? Like Crusoe is like we're going to build gigawatt data centers, right? Like okay, there's no competition there. There's like a few companies
doing that, right? So it's very different. So you either have to go like really really big or you need to move into the software layer or you just make
commercial real estate or you go bankrupt, right? Like these are the paths for all NeoClouds. I think I really have to believe there's a a
reason for being for these companies. And my like simple framework for it is I think the software layer is really hard
for people coming from this operation to to try and build, right? There's actually a lot of very specialized
software. So I think people will buy or partner into it. Yeah. But if you think about other inputs, it could be like I'm
very good at like finding and controlling power agreements, right? Um it could be like I build at a scale
other people are incapable of doing so as you mentioned which is which is like sort of what like or like wants me to exist, right? I
can't like think of like a lot of arguments beyond that and so I I I would agree with you like eventually we're
going to see consolidation uh either in this layer or you know commoditization
by the inference providers. But in the meantime, there is a lot of lunch to eat from Amazon who continues to charge, you
know, really and and Google and and Microsoft who continue to charge like absurd margins for their compute because
they're just used to doing that in CPU world. Yeah. Right. And so like their ROIC is like
extremely high on CPU and storage and and to assume that it can like translate
over to GPUs is is a bit of a fallacy and which is why which is why a lot of these companies are moving in right and
it's like okay in standard cloud there's a lot more software that like people can't just build out of nowhere. Yes,
EC2 is a product that is like pretty simple, but like block storage and all these other things are actually quite
difficult to do at scale well like that Amazon does and that's what makes them able to charge this absurd margin on
standard compute. But now like it's like well the cloud doesn't actually gener create any software that the user end
user actually uses right it's like sure I need summer kubernetes but then I'm just using pietorrch which is open source and I'm using a bunch of nvidia
software maybe or which is open source or I'm using a bunch of open source models I'm using you know v1 and sdglang which are open source it's like you just
go down the list it's like there's actually no software that the cloud can provide to deserve the margins that
Amazon and Google's clouds do have today if you're just infrastructure provider I think that there is software that the
cloud can provide, but the major clouds have not delivered that software. Agree. Agree.
Okay. Same same because it's it's really hard to do this stuff, right? Like there's no reason that every single startup needs to have
like multiple people dedicated to infra and like figuring out how to run models and like their SLA their reliability is
just so low, right? Like so many so many random SAS providers that are AI like they they have GPUs, they have open
source model, it works great except sometimes it fails and then it's down for eight hours and it's like why? Uh this shouldn't be a problem. It should
be something you should just be able to pay away. I mean, I I feel like the multi-trillion dollar question that you um have thought
What It Would Take to Challenge Nvidia
about for perhaps longer than um almost anyone else is like what does it take to actually challenge Nvidia? You know,
asking for a friend, what would it take? The like, you know, simple way to put it is like it's a three-headed dragon,
right? Like you have you have they're actually just really really good at, you know, engineering hardware and GPUs.
Like that is difficult. um they're really really good at networking and then they're really I would actually say
they're like okay at software but everyone else is just terrible. No one else is even close on software but you know and I guess in that argument you
can say they're great at software but like actually like you know installing Nvidia drivers is not like not always easy, right? Well there's great and there's also just
like well there's like 20 years plus of work in the ecosystem, right? Yeah. There's today's capability and
like usability and there's just like mass of like libraries. Yeah. So I think Nvidia is really hard
to take down because of those three reasons and it's like okay as a hardware provider can I do the same thing as Nvidia and win no they're an execution
machine and they have these three different pillars right I'm sure they have a lot of margin but like you have to do something different right um in
the case of the hyperscalers right Google uh with TPUs Amazon with Traia meta with MTIA they are making a bet of
I can actually do something pretty similar to Nvidia if you squint your eyes now like Blackwell and TPU is
starting like the the Nvidia architecture when TPU architectures are actually converging like same memory hierarchies and similar sizes of
systolic arrays like it's actually not that different anymore it's still quite different right but hand wave it's like pretty similar and tranium and TPUs are
very similar architecturally the hyperscalers are not doing anything crazy but that's okay because they can just like do the mass the margin game
that's fine but for a chip company to try and compete they must do something very unique now if you do something unique it's like okay all your energy is
focused on that one unique thing but on every other vector you're going to be worse like are you going to be there at the latest process node as fast as
Nvidia? No. Okay, that's like 20 30% right on cost/performance and power, right? Are you going to be on the latest
memory technology as fast as Nvidia? No, you'll be like a year behind. Great. Same same penalty. Are you going to be
the same on networking? No. Okay. You know, you just stack all these penalties up. It's like, oh wait, your unique
thing can't just be like two to fourx faster. It has to be like way faster. But then the problem is if you really
look at it simplistically, right? Like a flop is a flop, right? Uh again like this is super simple but like there is
not 10x you can get out of doing a standard vonoyoman architecture on efficiency of compute. Um, in which case
do all of these things that Nvidia will engineer better than you because they have a team of 50 people working on, you know, just memory controllers and HBM
and just like act and networking or actually like thousands of people working on networking. But like each of these things, do they just cut you by a
thousand and that's like, oh actually what would have been 5x faster is now only like 2x faster plus if I like
misstep I'm like six months behind and now the new chip is there, right? And you're screwed. So or or supply chain or
like intrinsic like challenges with okay getting other people to deploy it now or rack deployments. there's all these
supply chain challenges, right? Like literally in Amazon's most recent earnings, they said their like chip architecture is not aggressive. Their
their rack architecture is very simple. It's not that aggressive. They're like, "Yeah, we have rack integration yield issues, which is why we've had uh which
is they like blamed their miss on AWS for their tradeium not coming online fast enough because of rack integration
issues." And when you look at the architecture, like we have an article on it. It's like it's not like that crazy. Like it's like what Google was doing
like four or five years ago, right? And it's like, oh wait, supply chain is hard and Amazon couldn't get everything in
supply chain to work. And so therefore, they missed their AWS revenue by a few percent. Right? Which caused the whole
stock market to freak out. But it's like there's so many things that can go wrong in hardware and the time scales are so long. And then the last thing is that
like model architecture is not stagnant. If it was, Nvidia would optimize for it, but model architecture and hardware,
right? Software hardware codees is the thing that matters, right? And these two things, you can't just like look at one
in individual, right? Like there's a reason why Microsoft's hardware programs suck, right? Because they don't
understand models at all, right? Meta Meta, their chips actually work for recommendation systems and they're deployed for recommendation systems
because they can do hardware, software codees. Google's awesome because they do hardware, software, codees. Uh why is
AMD not catching up despite being awesome at hardware engineering? Well, yeah, they're bad at networking, but also they suck at software and they
can't do hardware, software codees. You know, there's like much deeper reasons why you can get into this, but you have to understand the hardware and the
software and they move in lock step. whatever your optimization is doesn't end up working right so one example is
all of the first wave AI company AI hardware companies right Cerebrus Grock uh Samba nova u graph core all of them
made a very similar bet no they were very different right some of these are architecturally pretty weird relative right they're architecturally pretty
weird but they made the same bet on memory versus compute right we're going to have more onchip memory and lower
bandwidth right offchip right because that was the trade-off they decided to So all of them had way more on chip
memory u than Nvidia right Nvidia their their onchip memory has not really grown
much from A100 H100 Blackwell right it's up 30% in like three generations whereas these guys had like 10x the onchip
memory right all the way back in like a when they were competing with A100 or even the generation before but that
ended up being a problem because they were like oh yeah we could just run the model on the chip right we can put the whole weight all the weights on there
and then you know we'll be so much more efficient and then the models just got way too big right and cerebr was like, "Oh, wait, but our ship is huge." Yeah.
Oh, wait. But still the model's way too big to fit on it. This is like very simple, right? You know, the same thing's happening in the other
direction, right? Like some companies are like, "Oh, we're going to make our like systolic array, your computer unit, super super super large because let's
say llama 70B is an 8K hidden dimension and your batch and all that." Like it's it's a pretty large maple. Oh, great.
Okay, we'll make this chip. And then all of a sudden all the models get super super sparse, right? Like the hidden dimension of
deepseeks models are like really tiny because they have a lot of experts, right? Instead of one large map, it's a
bunch of small ones. You do route route, right? Like and all of a sudden like if I made a really really large hardware unit, but I have all these small
experts. How am I going to run it efficiently? You know, I I no one they didn't really predict that the hardware would go that way, but then it ended up
going that way. And this is like this is actually the case with at least two of the AI hardware companies today. I don't
want to I don't want to shut them just because, you know, it's a let's be friendly. Uh but like this is like like
clearly like what's happening right? So it's like you can make a decision. It's a hardware bet that will actually be way
better on today's architectures, but then architecture evolves in the generality of like Nvidia's GPUs or even
like TPUs and trade is like more general than like as an architecture, but then it doesn't beat Nvidia by that much,
right? In which case they're just going to destroy you with they're six months or a year ahead on every technology
because they have more people working on it and their supply chain is better, right? So you you you it's kind of really tough to make the architecture
bet, have the models not just go in a different direction that no one predicted because no one knows where
models are headed, right? Even like, you know, you could get Greg Brockman and he might like have like a good idea, but like I'm sure he doesn't even know where
models will look like in two years. So there's got to be a level of generality and it's hard to like hit that
intersection properly. And so I'm very hopeful people compete with Nvidia. Um I think it'll be a lot more fun. There'd
be a lot less margin eaten up by the infra. There'd just be a lot more deployment of AI potentially um if
someone was able to compete with Nvidia effectively. But Nvidia charges a lot of money because they're the best and like
if there was something better, people would use it, but there isn't. And it's just really hard to get be better than them. I mean, you have to give the first gen
AI hardware companies some credit because they like made a secular correct decision about the workload, but then
the architectural decisions like ended up being hard to predict correctly, right? Then you have the cycle of Nvidia
innovation which is really hard to compete with. Y um both hardware and also as you said supply chain issues.
Even just putting together servers is hard. Yes. Um I think the thing that you point out that like people oversimplified was
with maybe a current generation of AI chip startups. They're like we're betting on transformers. And it's a lot
more complicated than that in terms of like workload at scale and continued evolution in model architecture. And
it's also not exposed so that if you're not working with the soda labs at like
from the beginning and then you can't make predictions because nobody can make a lot of predictions right now. It's
very hard to like say I'm going to be better at the workload two years from now in a like a very comfortable way.
Yeah. With no other changes happening like I can't make that bet right now. Yeah. And it's like one of the interesting things about OpenAI's open
source models, it's like all their training pipelines but on a quite boring architecture, right? like it's not their
crazy like cool architecture advantages that they have in their closed source models which are make it better for long
contexts or more efficient KV cache or all these other things right they're doing it on a standard model architecture that's publicly available
they like intentionally made the decision to open source a model with a boring architecture that's pretty much open source right already like people
have already done all these things and kept all the secrets internal that they wanted to keep and it's like what's
what's in there right are they even doing standard scale product attention probably, but like there's probably a
lot of weird things they're doing which don't map directly to hardware and like you mentioned, right? Like transformer
chip architecture is like there's a lot more complicated here than just like oh it's optimized for transformers because
like so is an Nvidia chip and a TPU and their next generation is more optimized for it. Like they take steps towards it.
They don't leap but as long as they're like close enough to where you are architecturally optimized for workload, they'll beat you because of all the
other reasons. And I think your description of like how might a like a chip startup win or any vendor win by
specializing like that actually is really hard in this era like generalization may continue to win to a
degree and it happened with all the edge hardware companies too. You know, we talk about the firstg AI hardware companies for data center. There were a
handful, but for the edge, there were like 40, 50 and like none of them are
winning because it turns out the edge is just take a Qualcomm chip or an Intel
chip that's made for PC or smartphone and deploy it on the edge, right? Like that ended up being way more meaningful.
So, so it ends up being like the incumbents, they can take steps towards what you're going for and if you didn't
execute perfectly or if the models didn't change the architecture away from what you thought it would be, you end up failing.
What Would an Nvidia Challenger Look Like?
If you had to make a bet that something becomes competitive, what is the configuration or company type that that
does that? I don't want to show any company that I've invested in or anything like that. And so therefore, not investment advice.
No, no, but like I' like I like I would just say like I probably think that like AMD GPUs or Amazon's Tranium will be
probably more likely to be a best second choice for people or Google TPU of course, but I think Google's just more interested in it for internal workloads.
I I just think that those will be much more likely options uh to succeed than a
chip hardware startup. Yeah, but I mean I really hope they do because there's some really cool stuff they're doing. If
Understanding Operational and Power Constraints for Data Centers
we zoom out to um the macro and we think
about just the scale of um hardware and data center deployment for these workloads, people talk a lot about the
operational constraint on building data centers of this size. The uh power constraints I think in particular on the
power side it's very interesting how that practically shows up. Is it generation at scale at cost? Is it grid
issues? This is a like how how should you know more people in technology understand this? Yeah. So supply chain is always like fun
because like people want to point at one thing is the issue. Um but always ends up being these things are so complicated
like if one thing was solved you could increase production another 20% and then something else would be the issue.
You think it's a multi-bottleneck issue? Yeah. Or like hey for company A it's actually because their supply chain is
this this is the issue and for company B it's this is the issue. But, you know, that's sort of in generalities, but like
I think zooming out, right? Like Noah Noah opinion like he had a really fun blog about like is this AI hardware
buildout going to cause a recession? I I think it's actually funny because you could flip the statement and be like actually the US economy would not be
growing that much this year if it weren't for all the AI buildouts and as a result data center infrastructure. As
a result, electricians wages have soared. As a result, power deployments and other capital investments which have
15 30-year lifespans are being made and all of this capex is in turn actually
growing the economy. And like actually maybe the economy wouldn't even be growing much or at all if it weren't for
all of these investments. One thing that is perhaps looked over from the um White House AI action plan
was the view of like we're going to build these AI data centers in the United States. we're actually going to need like a lot of general investment
beyond the GPUs and the power which are everybody's first two items into like labor for example right so if you just
you know for simplicity sake be like it's the size of Manhattan and we have to run it and it's a new system with
changing topology and like very high degree of relatively novel hardware with failure yeah and like lots of networking
that I'm like like kind of feels like we need to have a bunch of new capacity like from a labor or robotics In like 23
it was very simple. It's like Nvidia can't make enough chips. Okay, why can't Nvidia make enough chips? Oh, co-ass
right? Chip on wafron substrate packaging technology. And I was like oh HBM, right? Like those were like it was like very simple 23 24 like yeah all
these tools involved in that supply chain. It was great but then it like very quickly became much more murky,
right? Then I was like oh data centers are the issue. Oh okay, we'll just build a lot of data centers. Oh wait, substation equipment
and transformers are the issue. Oh wait, power generation is the issue. It's not like the other issues went away, right?
Like actually, you know, cos uh is still a bottleneck and HBM is still a bottleneck. Optical transceivers are
still a bottleneck, but so is power generation and data center physical real estate, right? Like I mentioned like
Meta is literally building these like temporary like tent structures to put GPUs in because building the building
takes too long and it takes too much labor, right? As you mentioned, labor, right? That's like one way they were able to remove a part of a constraint.
They're still constrained on power and they had to delay the uh bring up of some GPUs in Ohio because the a grid in
Ohio like had some issues, right? The utility, right? Uh with like bringing on a generator or something, right? Oh, okay, great. Uh well, we'll buy our own
generators and put them on site. Oh, wait. Now there's an eight-year backlog or whatever, four-year backlog for G's
turbines. Yeah. Oh, okay. Um I'm I'm Elon. I'm going to buy a power plant from overseas that's
already existing. I'm going to move it in. Okay, great. Now, there's like permits and people protesting against me in Memphis. Like, you know, there's like
there's like a bajillion things that could go wrong. And labor is a huge one. I've literally had people in pitches be
like, "No, no, no. We've already booked all the contractors, so no one else is going to be able to build a data center
in this entire area of this magnitude besides us because we took all the people. We took all the people. They're going to
have to fly them in." But it's like, okay, fine. Like, you can fly them in, but it's like there's just like not that many electricians in America. And as a
result, we've seen the wages rise a lot for people building data center infra. There's a group of like these Russian
guys who used to work for Yandex, Russia's search engine, who like wire up data centers who now live in America and
they get paid a ton like and they get paid bonuses for being faster and therefore they do like certain drugs to
be able to finish the buildouts faster because they get bonuses based on how fast they build it, right? Like it's like there is crazy stuff going on to
alleviate bottlenecks, but it's like there's bottlenecks everywhere. And it really just takes a really really hyper competent organization tackling each of
these things and creatively thinking about each of these things because if you do it the layman old way, you're going to you're going to lose and you're
going to like you're going to be too slow, right? Which is why OpenAI and Microsoft partially like Microsoft is not building Stargate for OpenAI, right?
It's because it would have just been too slow and they're doing it the lame and old way. You have to go crazy. You have to go That's why Microsoft rents from
Core Wee a ton, right? because oh wait we we we need someone who can do things faster than us and oh look corweave is
doing it faster and now like you know open is like going to Oracle and Cororeweave and and others right Ncale in Finland and all these other companies
all around the world the Middle East right G42 like anywhere and everywhere they can get compute because you put
your eggs in many baskets and whoever executes the best will win and this infrastructure is very very hard
software is like fast turnaround times like you know it's it's still hard software is not easy but it's like the
cycle time is very fast for like Try something, fail, right? Try something else. It is not for infra, right? Like
what has XAI actually done to deserve their prior funding rounds? They haven't released a leading edge model, right?
And yet their valuation's higher than Enthropic today, right? At least, you know, Enthropic's raising, but whatever, right? Like it's Elon A. And B, they've
tackled a problem creatively and done it way faster than anyone else, which is building Colossus, right? Like, and that's like commendable because that is
part of the equation of being the best at models, right? Yeah. Besides the talent. Yeah. Yeah. And and Elon is like known for
being able to get talent. So, it's like it's like there's there's so much complicated on the infra that, you know, it'd be nice to say there's one thing,
but yeah, like the White House action plan lists a lot of things, but I want like, you know, how do we concretely
like solve the talent issue? It's like there's not enough people in trade school. The pay will go up and that'll
help, but the time scales in that are too slow. Like, do we somehow import labor? Right? That's how the Middle East is building all their data centers.
They're just importing labor. Or is there something more intelligent we could do? Robotics, right? Right. I think I I I just realized today you told
me just now like a company I seen or I angel invested in you led the round, right? Like it's really cool for data center optim u automation, right? Like
there's all sorts of like interesting problems on the infra layer that could be tackled uh and tackled creatively.
Dylan’s View on the American Stack
Speaking of like the policy and geopolitics implication here, like what
do you think about the, you know, White House um implication that America needs to like export the AI stack or like
needs to control important components of it? Like it's better for us to be exporting Nvidia chips than to foster a
new industry. It's better for us to have like a globally leading open-source model, etc. Like what actually makes
sense to you there? I want to tell a crazy story. I was in Lebanon. Okay. uh for a week. It was a good start.
This is completely unrelated, but it just popped in my head. I think it'll be entertaining. I was in Lebanon. I was with a few of my friends. Uh so like two
Indian people, two Chinese people, and then a Lebanese person, right? Um and these like 12-year-old girls right up to
the Chinese woman that was with us, like my friend, and they were like, "Oh my god, your skin's so beautiful. Do you
like sushi?" Right? And it's like, "Fine, you're just ignorant." But what was really interesting is like when they asked where we're from, we're like San
Francisco. They're like, "Do people get shot in the streets?" because their entire worldview was built from Tik Tok, okay,
of politics. And it's like when you think about the global propaganda machine that is Hollywood and it's not
intentional, it's just American media is pervasive. It built such a positive image of America. Now like with
monoculture broken and it's more social media based. A lot of the world thinks America is like people are getting shot
all the time and it's like really bad and it's like bad lives and people are working all the time. It's unsafe and
like you know like Europe has a certain view of America and like I don't think it's accurate. like random Lebanese 12-year-old had a really negative view
of some like they liked America. They loved Target for some reason because some influencers posted Tik Toks about
Target, but like they had negative views of America. It's like from a sense of like what is important
is like the world should still run on American technology, right? And they generally do still in terms of the web,
although you know, bite dance Tik Tok has broken that to a large degree. But in this next age, do you want them to
run on Chinese models which now have Chinese values which then spread Chinese values to uh the world or do you want
them to have American models that have American values like you talk to Claude and has a worldview, right? And it's
like I don't know if you want to call that propaganda or what there's a worldview that you're pushing, right? And so I think it makes sense that we
need that worldview espouseed now. How do you do that, right? The prior administration, current administration
had different viewpoints on this, right? Pride administration said, "Yes, we would love for the whole world to use our chips, but it has to be run by
American companies." And so it was like, "Microsoft, Oracle, we're cool with you building shitloads of capacity in
Malaysia. We don't want random other companies doing it in Malaysian." So the prior diffusion rule had a lot of
technical ways in which like, you know, you could be you could have these like licenses and all this. And it was very hard for like random small companies to
build large GPU clusters, right? But it was very easy for Microsoft and Oracle to do it in in Malaysia. Of course, the
current administration tore that up and they have their own view on things. I I I mean, I think there was a lot of things wrong with the diffusion rules,
right? They were just too complicated. They pissed a lot of people off, etc. Now, they have a different view, which is like what did they do in the Middle
East, right? With the deal they signed. Well, actually, most of those GPUs are being operated by American companies or
rented to American companies, right? Either or, right? like G42 operating them but renting them mostly to like OpenAI and such for a large part or
Amazon and Oracle and others are operating the GPUs themselves in the Middle East. So it's like okay that's
effectively the same thing but in a very different way. That is still I think a view right which is like we want America
to be as high in the value stack as possible right if we can sell tokens or if we can sell services we should
okay but if we can't sell the service let's at least sell them tokens okay we can't sell them tokens at least sell them like infra right um whether it be
data centers or renting GPUs or just the GPUs physically um and it sort of like
makes sense right in the value chain like give them the highest value highest margin thing where we capture most of the value and like squeeze it down to
where like actually for like the bottom of the stack, right? Like the tools to make chips, maybe you shouldn't sell.
And so like ex current export controls and policy dictate that. Yes, you know,
it's better to sell them services, but sell them both, right? Like give the option, let us compete. Uh and don't let
anyone else win. I think the challenge here is that like how much are you enabling China by selling them their
RGPUs? Like how much fear-mongering around like Huawei's production capacity is there? like how realistic it is it
versus not because of the bottlenecks of like Korea sanctions that America's made Korea put on China for memory or Taiwan
on China for uh chips or you know US equipment on China right like there's a lot of different sanctions many of these
are not well enforced slash have holes but it's sort of like a it's a very difficult argument on like how much
capacity of GPUs should be sold to China a lot of people in San Francisco frankly
don't sell at China any GPUs but then they cut off rare earth minerals and you know like obstensively most people think
that like the deal was that you get you get GPUs and also EDA software because the administration banned EDA software
for a little bit just for like a few weeks basically until China was like okay we'll ship rare earth minerals you can't just ban everything because China
can retaliate if they banned rare earth minerals and magnets and such car factories in America would have shut
down and the entire supply chain there would have had like hundreds of thousands of people not working right like you know like there is like
there is a push forward Yeah, there's a push and pull here. So, like, do I think China should just have the best Nvidia GPUs? No. Like, that that
would suck. But like, you know, can you give them no GPUs? No, they're going to retaliate. Like, there is a middle ground. And like, Huawei is eventually
going to have a lot of production capacity, but there's ways to slow them down, right? Like, properly ban the equipment because it's not there's a lot
of loopholes there. Uh, properly ban the subcomponents of like of memory and wafers because Huawei is still getting
uh, you know, wafers in Taiwan from TSMC through like shell companies, right? like it's like you know there there's a
lot of enforcement challenges because parts of the government are not like funded properly or not competent enough
and has never been competent right so it's like how do you work within this framework well like okay fine we should sell them some GPUs so that they you
know that kind of slows them down on a Huawei standpoint although not really right uh but also like gets us back the
rare earth minerals but don't sell them too many right like how do you find that massive gray line is what the administration's grappling with in my
view implied in that opinion in is your belief of they are going to be able to build Nvidia equivalent GPUs eventually
if forced maybe not equivalent sorry price performance competitive there's like interesting things here
right like if China has a chip that consumes 3x the power but they have 4x the power then
yeah like who cares right like you know obviously there's a lot of supply chain challenges with building that and it's like hey maybe it's on n minus2
technology it's on 5-year-old technology or four-y old technology great um and it only consumes 3x the power because they
were able to do a lot software optimization, architecture optimization, etc. They end up with something that maybe cost a little bit more, but like
when you think about the value of a GPU today, right? Like you know the GPUs dominate the cost of everything. Uh but
over time services will be built out which are high margin, right? Like and you can go look at Enthropic or OpenAI fundraising docs and like see that their
API margins are good. API margins are nothing compared to what service margins will be for people who use these APIs to
build services. And that's nothing compared to the like net good to the economy from how much automation can
happen and how much increased economic activity there is. So this is the argument of like okay even if their chips cost 3x as much do you
they can subsidize that rationally. They can subsidize that rationally because the end goal is like oh wait actually we can deploy a lot of Chinese
AI and make money and gather data because people are sending us their like prompts and all their data bases and all
this stuff to our models controlled by our companies etc. Right? Um, plus we're just making money off of it. And they've
done this in other industries, right? They rationally subsidize like solar and now no one can even compete on solar or
EV and it's like very close to no one could compete on EVs even, right? Besides like Tesla really. And even
Tesla's adopting a lot of like Chinese supply chain, right? It is rational to say you want to have America have more
AI prowess around the world, you know, so that random child in Lebanon doesn't think America is like bad or they're
using American products more than China, Chinese products. But like how you get there is very difficult and it's a it's
it's a hard thread to weave. Thread. You got it. I don't croquet, you know. Oh my god. Crochet.
Crochet. There we go. You clearly don't. Croquet is the amazing croquet is the game. Um I want to ask you like a wild card question to
What Dylan Would Ask Mark Zuckerberg
uh finish out. Um we're trying to get Mark to do the podcast. Zuck. Yes. Uh you can ask him any question.
What would you ask Mark? You got to do the podcast. I thought like the like did you read the doc the page they put up? I thought that
was very interesting that they were like, "We want AI to be your companion." So my question to him is not like around his infra stuff because I feel like I
know most everything like you can figure that stuff out from supply chain and like satellites and all this stuff, but like the interesting thing I'm curious
about is philosophically what exactly like does the world look like? If everyone is talking to AIS more than
other people or if they're interacting socially with the AIS more than other people, do we lose our human element? Do
we lose our human connection? It's not the same thing as hey I'm posting on social media and we're interacting with
their social media posts which that already breaks the brain of a lot of people. What happens when it's like always on your face like met you know
his worldview is like meta reality labs makes these like devices that you wear and they're always they have all this AI
on them and you're talking to the AI companion all the time. How does that change the human psyche like this human
machine evolution like is what are the negative ramifications of it? What are the positive ramifications? How do we
how are you going to make sure that there's more positive ramifications from this than like you know the sloppification and like complete brain
rot of like our youth right which I I like love my brain rot right like it's like okay
Poker and AI Entrepreneurship
obviously the coding wars continue to be like very central and we were talking about cognition's
relevance and like how how to think about the strategy here but I do think it's really funny what flipped your bit
on cognition can you tell the story I I thought cognition NGMI, right? Like, you know, like OpenAI,
Enthropic, XA, etc. They're just going to make better code models like you know, they just have way more resources.
General models will win, you know, hadn't really met too many people there. It was just like a pure vibes based thing. And I, you know, I'd used a
little bit of of Devon, but it was like whatever, right? Like it was like cloud code seems better and we use that internally. But like I went to KTO's
East meets West event. It's awesome event where there's people from Asia. like there was like you know all these like CFOs and CEOs of like major Chinese
companies uh east coast of US all these finance bros also west coast like a lot of tech people right so you and I were
both there there were people from governments and major companies and Scott was there um I spoke with them
like very briefly but then what was interesting is like it's like you know they have a poker night one night and everyone gets blasted the the like
leader of co is very good at poker hedge fund guys are just good at poker generally people like poker as well you
know there's a big poker culture in the bay Okay, I was playing. I'm okay, right? Um, but I see I see I look over
at the super high stakes table. Scott's just dominating everyone, right? I'm like, what is going on? Like, how are
you like you're like taking chips from like CEO of major Chinese company? I don't want to name people's names
because I think there's like some terms around them like naming who's there, but like, you know, it's like you're you're like winning like a lot of chips from a
lot of big people. And it's like all of a sudden my vibes were like, I don't know, maybe like maybe he can win, maybe he can take from the lion, you know. Uh,
so I was like very excited about that. You know, I thought it was funny. I still have zero like I I have not done
much due diligence on their code product like you know like it's like nor have I on like cloud code besides the fact that
we use it but it's like you know cool. Well I think wind surf acquisition part two is like a a pretty good hand to play
here. Um and uh you know as somebody who invests a lot at a you know violently
competitive application level. Yeah. Poker game is live man. Everybody there you just invest in live players.
Exactly. And it's I I just loved that, you know, that was how he uh he dominated everyone. It's like it's like
it's such a stupid reason because I pride myself on being analytical and like data driven. And it's like, you
know, vibes. Correct. For any entrepreneurs listening, I think like you know, Dylan might angel invest or we might back you
fully if you if you win the cognition poker game. Uh and we'll host at Conviction. Um okay, we got it. Good.
Conclusion
Awesome. Yeah. Thank you. Find us on Twitter at no prior pod.
Subscribe to our YouTube channel if you want to see our faces. Follow the show on Apple Podcasts, Spotify, or wherever
you listen. That way, you get a new episode every week. And sign up for emails or find transcripts for every episode at no-bers.com.