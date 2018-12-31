# fox-recover

Replicate and Recover MySQL database changes through message broker

This project is aimed to synchronize local database with remote storage through
the web sockets. The message broker provides ability to mixup event sources and
transform required messages according to the businness needs. Subscription pattern adds
flexibility to have required tables synchronized.

## Replicate
Catch MySQL bin log and transfer it through Web Queue Server

## Message Broker
Fox-WAMP Web Application Message Server provides functionality to trasform messages

## Recover
Apply received messages to the local MySQL database.
