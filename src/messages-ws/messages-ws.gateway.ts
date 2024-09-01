import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dtos/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces';

@WebSocketGateway({ cors: true })
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly messagesWsService: MessagesWsService, private jwtService: JwtService) {}

  @WebSocketServer() wsS: Server
  
  handleDisconnect(client: Socket) {

    //console.log("Client disconnected:", client.id);
    this.messagesWsService.removeClient(client.id);

    this.wsS.emit('clients-updated', this.messagesWsService.getClients());
  }

  async handleConnection(client: Socket, ...args: any[]) {

    const token = client.handshake.headers.authentication as string;
    let payload: JwtPayload;
    try {

      payload = this.jwtService.verify(token);
      await this.messagesWsService.registerClient(client, payload.id)!;
      
    } catch (error) {
      client.disconnect();
      return;
    }

    //console.log("Client connected:", client.id)
   

    this.wsS.emit('clients-updated', this.messagesWsService.getClients());
  }

  @SubscribeMessage('message-from-client')
  handleMessageFromClient(client: Socket, payload: NewMessageDto){
    
    //Only for this client
    /*client.emit('message-from-server', {
      fullName: 'Soy yo',
      message: payload.message
    })*/

    //For all clients except this
    /*client.broadcast.emit('message-from-server', {
      fullName: 'Soy yo',
      message: payload.message
    })*/

    this.wsS.emit('message-from-server', {
      fullName: this.messagesWsService.getUserFullName(client.id),
      message: payload.message
    })
  }

}
