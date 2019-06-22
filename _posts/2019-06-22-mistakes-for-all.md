---
title: "Seven Mistakes Every Programmer Should Make"
layout: post
tags: programming, listicle, humour
---

Lots of people are willing to tell you things you "have to learn" before you start seriously programming, but I find that I learn best by just making mistakes. So here's seven mistakes you should make once you start programming.

## 1. (Gently) Abuse a Scripting Language

Ever wondered what people mean by the [GIL in Python](https://wiki.python.org/moin/GlobalInterpreterLock)? Why not find out first-hand! You could also try running a data-processing heavy Rails server, or why not try out [wxPerl](http://www.wxperl.it) for your next desktop app. Any use of PHP also checks this item off.

## 2. Run Out of Memory in the JVM

There must be some programmers out there (bless them) that don't ever need to use the JVM, but for most of us at some point we'll be writing Java, or maybe Kotlin or Clojure. Since the JVM can be a bit of a memory monster it's not hard to make a mistake and run through the default amount of memory on your system. Then you get to watch the computer grind like crazy trying to do garbage collection. Bonus points if you're running test/CI on a really small cloud instance so it works fine in dev and just falls over in the cloud.

## 3. Drop the Database Unexpectedly

Sometimes you really mean to drop the database, but it's always fun to drop it when you were trying to do something else. A classic way to do this is to copy-paste the wrong SQL block against a live database, but hey it's up to you.

## 4. Abuse the Main Thread

Can't quite get your head around threading? Just use the main thread! Bonus points if the "main" thread is the UI thread in a native application.

## 5. Do Something Nasty in JavaScript

There's so *many* ways to do terrible things in JavaScript that this almost feels like a cheat, but the trick with this one is to do something that works but will be baffling to any future developers (including yourself). The classic would be using a `|`, `&`, or `==` (not `||`, `&&`, or `===`) and really meaning it; you could also try deleting variables or anything else a good linter might take exception to. Bonus points here if you managed to redefine `undefined` [back in IE8](http://kangax.github.io/compat-table/es5/#test-Immutable_undefined).

## 6. Think You've Found a Compiler or Interpreter Bug

Eventually you'll find an actual bug in a compiler or interpreter you use a lot (there's only a small chance it will be unknown). But long before that you'll *think* you've found a bug, probably when you've just done something really silly. If you're unlucky you'll post this in a bug tracker or mailing list and get a massive eyeroll from the maintainers.

## 7. Write Something That Takes Forever to Run

This usually happens when you're in a hurry and you realise the computer doesn't get weekends. This is hopefully a simple thing like some log analysis script and not a scary mistake like running a script that in-place updates the production DB while other people are using it and you're in bed.

## It's (Probably) Okay

You're never going to stop making mistakes. I get annoyed with my old work at least every other day, but really beating yourself up over it isn't going to help. Try and be as constructive as you can when you make mistakes. For small mistakes, it's often enough to make a mental note and move on. For larger mistakes, look out for structural problems that are behind your mistake. Would it be helpful to get things like this reviewed by more people in future? Did I just grab the complete wrong end of the stick because I didn't ask enough questions? Can I write some automated tests to prevent this? Can I turn on a linter or compiler feature that will warn me? Can I spin up a duplicate environment to check this on instead of the main test environment? Even something simple like "don't merge into the master branch just before leaving for the day".
