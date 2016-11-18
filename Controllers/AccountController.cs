using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;

namespace aspnet_orders.Controllers
{
    public class AccountController : Controller
    {
        // GET: Account
        [AllowAnonymous]
        [HttpGet]
        public ActionResult Login()
        {
            return View();
        }

        [HttpPost]
        public ActionResult Login(Manager account)
        {
            using (MyDataEntities mde = new MyDataEntities())
            {
                var user = mde.Managers.Where(a => a.Username.Equals(account.Username) && a.Password.Equals(account.Password)).FirstOrDefault();
                if (user != null)
                {
                    FormsAuthentication.SetAuthCookie(user.Username, false);
                    return RedirectToAction("Orders");
                }
                else
                    ViewBag.Error = "Incorrect user or password";
            }
            ModelState.Remove("Password");
            return View();
        }

        [Authorize]
        [HttpGet]
        public ActionResult Orders()
        {           
            return View();
        }

    }
}