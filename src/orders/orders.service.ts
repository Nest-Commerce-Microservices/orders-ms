import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ENTITY_NAMES, handlePrismaError, PrismaService } from 'src/common';
import { ChangeOrderStatusdto, OrderPaginationDto, CreateOrderDto } from './dto';
import { NATS_SERVICE } from 'src/config';
import { Product } from './interfaces';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,

    private readonly prisma: PrismaService,
  ) {}

  //TODO: Refactorizar en multiples helpers con documentacion
  async create(createOrderDto: CreateOrderDto) {
    try {
      // 1. Confirmar los ids de los productos (sin repetidos)
      const productIds = Array.from(new Set(createOrderDto.items.map((item) => item.productId)));
      const products = await firstValueFrom<Product[]>(
        this.client.send({ cmd: 'validate_product' }, productIds),
      );

      // 2. Crear un Map para acceso eficiente
      const productMap = new Map<number, Product>(products.map((p) => [p.id, p]));

      // 3. Preparar datos y cálculos en un solo paso, validando productos
      let totalAmount = 0;
      let totalItems = 0;
      const orderItemsData = createOrderDto.items.map((orderItem) => {
        const product = productMap.get(orderItem.productId);
        if (!product) {
          throw new RpcException({
            message: `Producto ${orderItem.productId} no encontrado`,
            status: HttpStatus.NOT_FOUND,
          });
        }
        totalAmount += product.price * orderItem.quantity;
        totalItems += orderItem.quantity;
        return {
          price: product.price,
          productId: orderItem.productId,
          quantity: orderItem.quantity,
        };
      });

      // 4. Crear la orden en la base de datos
      const order = await this.prisma.order.create({
        data: {
          totalAmount,
          totalItems,
          OrderItem: {
            createMany: { data: orderItemsData },
          },
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              productId: true,
              quantity: true,
            },
          },
        },
      });

      // 5. Armar la respuesta, agregando el nombre del producto
      const { OrderItem, ...orderData } = order;
      return {
        ...orderData,
        orderItem: OrderItem.map((orderItem) => ({
          ...orderItem,
          name: productMap.get(orderItem.productId)!.name,
        })),
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      handlePrismaError(error, `${this.constructor.name}::create`);
    }
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const limit = orderPaginationDto.limit ?? 10;
    const page = orderPaginationDto.page ?? 1;
    try {
      const totalItems = await this.prisma.order.count({
        where: {
          status: orderPaginationDto.status,
        },
      });

      const lastPage = Math.ceil(totalItems / limit);

      const data = await this.prisma.order.findMany({
        take: orderPaginationDto.limit,
        skip: (page - 1) * limit,
        where: {
          status: orderPaginationDto.status,
        },
      });

      return {
        data,
        meta: {
          totalItems,
          currentPage: orderPaginationDto.page,
          perPage: orderPaginationDto.limit,
          totalPages: lastPage,
          nextPage: page < lastPage ? page + 1 : null,
          previousPage: page > 1 ? page - 1 : null,
        },
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      handlePrismaError(error, `${this.constructor.name}::findAll`);
    }
  }

  async findOne(id: string) {
    try {
      const order = await this.prisma.order.findFirst({
        where: { id },
        include: {
          OrderItem: {
            select: {
              price: true,
              productId: true,
              quantity: true,
            },
          },
        },
      });

      if (!order) {
        throw new RpcException({
          message: `Order with ID ${id} not found`,
          status: HttpStatus.BAD_REQUEST,
        });
      }

      const productIds = order.OrderItem.map((orderItem) => orderItem.productId);
      const products = await firstValueFrom<Product[]>(
        this.client.send({ cmd: 'validate_product' }, productIds),
      );

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((product) => product.id === orderItem.productId)!.name,
        })),
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      handlePrismaError(error, `${this.constructor.name}::findOne`, {
        id,
        entity: ENTITY_NAMES.ORDER,
      });
    }
  }

  async changeStatus(changeOrderStatusDto: ChangeOrderStatusdto) {
    try {
      const { id, status } = changeOrderStatusDto;

      const order = await this.findOne(id);

      if (order.status === status) return order; // No change needed

      return await this.prisma.order.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      if (error instanceof RpcException) throw error;
      handlePrismaError(error, `${this.constructor.name}::findOne`);
    }
  }
}
