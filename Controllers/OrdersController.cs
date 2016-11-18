using aspnet_orders.ViewModels;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Script.Serialization;
using System.Web.Security;

namespace aspnet_orders.Controllers
{
    public class OrdersController : ApiController
    {

        // GET: api/Order?pageNo=pageNo&orderParam=oederParam
        // GET: api/Order/1/string        
        //public string Get(int pageNo, string orderParam)
        //{
        //    return "The [Route] with multiple params worked";
        //}
        [HttpGet]
        public async Task<string> GetAll()
        {
            // Get all elements from DB
            using (MyDataEntities mde = new MyDataEntities())
            {
                var query = (from b in mde.Orders
                             join man in mde.Managers on b.ManagerId equals man.ManagerId
                             orderby b.Number
                             select new
                             {
                                 OrderId = b.OrderId,
                                 Manager = man.Name,
                                 Number = b.Number,
                                 Created_date = b.Created_date.ToString(),
                                 Delivery_date = b.Delivery_date.ToString(),
                                 Description = b.Description
                             });
                var toJson = await query.ToListAsync();
                var jsonSerialiser = new JavaScriptSerializer();
                var json = jsonSerialiser.Serialize(toJson);
                return json;
            }            
        }
        [HttpGet]
        public async Task<string> GetPaged(int pageNo = 1)
        {
            // If authentitcated user
            if (IsLoggedIn())
            {
                // get query to json with paging
                using (MyDataEntities mde = new MyDataEntities())
                {
                    int totalPage, totalRecord, pageSize;
                    pageSize = 5;
                    totalRecord = mde.Orders.Count();
                    totalPage = (totalRecord / pageSize) + ((totalRecord % pageSize) > 0 ? 1 : 0);
                    // Order records by
                    var query = (from b in mde.Orders
                                 join man in mde.Managers on b.ManagerId equals man.ManagerId
                                 orderby b.Number
                                 select new
                                 {
                                     OrderId = b.OrderId,
                                     Manager = man.Name,
                                     Number = b.Number,
                                     Created_date = b.Created_date,
                                     Delivery_date = b.Delivery_date,
                                     Description = b.Description
                                 });                    
                    var pagedQuery = query.Skip(pageSize * (pageNo - 1)).Take(pageSize);
                    var toJson = await pagedQuery.ToListAsync();                    
                    OrdersWithPaging pagedOrders = new OrdersWithPaging
                    {
                        Orders = toJson,
                        TotalPage = totalPage
                    };
                    var jsonSerialiser = new JavaScriptSerializer();
                    var json = jsonSerialiser.Serialize(pagedOrders);
                    return json;
                }
            }
            else
            {
                return "You are not authorized to view this";
            }
        }
        [HttpGet]
        public async Task<string> GetManagers()
        {
            if (IsLoggedIn())
            {
                using (MyDataEntities mde = new MyDataEntities())
                {
                    //var query = await mde.Managers.ToListAsync();
                    var query = await (from m in mde.Managers
                                       select new
                                       {
                                           ManagerId = m.ManagerId,
                                           Name = m.Name
                                       }).ToListAsync();
                    var jsonSerialiser = new JavaScriptSerializer();
                    var json = jsonSerialiser.Serialize(query);
                    return json;
                }
            }
            else
            {
                return "You are not authorized to view this";
            }
        }
        public class ClientOrder
        {
            public string OrderId { get; set; }
            public string Number { get; set; }
            public string Description { get; set; }
            public string ManagerId { get; set; }
            public Nullable<DateTime> Delivery_date { get; set; }
            public string Status { get; set; }

        }
        // POST: api/Order
        // Create and update order
        [HttpPost]
        public HttpResponseMessage UpdateOrder([FromBody]ClientOrder order)
        {
            HttpResponseMessage response;
            if(!IsLoggedIn())
            {
                return response = Request.CreateResponse(HttpStatusCode.Forbidden, "Error! You're not logged in.");
            }
            if (String.IsNullOrEmpty(order.Number))
            {
                ModelState.AddModelError("Number", "Please enter number");
            }            
            //var result = JsonConvert.DeserializeObject<string>(value);
            if (ModelState.IsValid)
            {                
                using (MyDataEntities mde = new MyDataEntities())
                {
                    if(order.Status == "create")
                    {
                        // Create new order
                        Order newOrder = new Order
                        {
                            OrderId = Guid.NewGuid(),
                            Number = order.Number,
                            ManagerId = new Guid(order.ManagerId),
                            Created_date = DateTime.UtcNow,
                            Updated_date = null,
                            Delivery_date = order.Delivery_date,
                            Description = order.Description
                        };
                        mde.Orders.Add(newOrder);
                        mde.SaveChanges();
                        response = Request.CreateResponse(HttpStatusCode.Created, order);
                    }
                    else
                    {
                        //Update exsisting order
                        Order updatedOrder = mde.Orders.Where(o => o.OrderId.ToString().Equals(order.OrderId)).FirstOrDefault();
                        if(updatedOrder != null)
                        {
                            updatedOrder.Number = order.Number;
                            updatedOrder.ManagerId = new Guid(order.ManagerId);
                            updatedOrder.Updated_date = DateTime.UtcNow;
                            updatedOrder.Description = order.Description;
                            updatedOrder.Delivery_date = order.Delivery_date;
                            mde.SaveChanges();
                            response = Request.CreateResponse(HttpStatusCode.OK, order);
                        }
                        else
                            response = Request.CreateResponse(HttpStatusCode.BadRequest, "Error! Cannot find order with this guid.");
                    }                                                          
                }                
            }
            else
            {
                response = Request.CreateResponse(HttpStatusCode.BadRequest, "Error! Please try again with valid data.");
            }
            return response;
        }

        // PUT: api/Order/5
        public void Put(int id, [FromBody]string value)
        {
        }

        // DELETE: api/Order/5
        public void Delete(int id)
        {
        }

        #region Helpers
        /// <summary>
        /// Check is user Anonymous or Authenticated
        /// </summary>
        /// <returns></returns>
        private bool IsLoggedIn()
        {
            var currentUser = System.Web.HttpContext.Current.User.Identity.Name;
            if (!String.IsNullOrEmpty(currentUser))
            {
                return true;
            }
            else
            {
                return false;
            }
        }
        #endregion
    }
}
