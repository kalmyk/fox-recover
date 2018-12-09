# fox-recover

Replicate and Recover MySQL database changes through message broker

This project is aimed to synchronize local database with remote storage through web sockets.

## Replicate
Catch MySQL bin log and transfer it through Web Queue Server

## Message Broker
Fox-WAMP Router

## Recover
Apply received messages to the local MySQL database.

