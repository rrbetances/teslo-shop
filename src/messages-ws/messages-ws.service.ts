import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { User } from 'src/auth/entities/user.entity';
import { CustomRepositoryCannotInheritRepositoryError, Repository } from 'typeorm';

interface ConnectedClients {
    [id: string]: {
        socket:Socket;
        user:User
    }
}

@Injectable()
export class MessagesWsService {

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>){}

    private connectedClients : ConnectedClients = {}

    async registerClient(client: Socket, userId: string){

        const user = await this.userRepository.findOneBy({ id: userId });

        if(!user) throw new Error('User not found');
        if(!user.isActive) throw new Error('User is not active');

        this.checkUserConnection(user);

        this.connectedClients[client.id] = { socket: client, user};
    }

    removeClient(clientId: string){
        delete this.connectedClients[clientId];
    }

    getClients() : string[]{
        return Object.keys(this.connectedClients);
    }

    getUserFullName(socketId: string){
        return this.connectedClients[socketId].user.fullName;
    }

    private checkUserConnection(user: User){
        for(const clientId of Object.keys(this.connectedClients)){
            const connectedClient = this.connectedClients[clientId];

            if(connectedClient.user.id  === user.id){
                connectedClient.socket.disconnect();
                return;
            }
        }
    }
}
