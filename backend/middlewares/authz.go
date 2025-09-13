package middlewares

import (
	"net/http"

	"example.com/sa-gameshop/services"
	"github.com/gin-gonic/gin"
)

type ctxKey string

const (
	CtxUserID ctxKey = "userID"
	CtxRoleID ctxKey = "roleID"
)

type RequireMode int

const (
	RequireAll RequireMode = iota
	RequireAny
)

func RequirePerm(ps *services.PermService, mode RequireMode, perms ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleIDVal, ok := c.Get(string(CtxRoleID))
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "no role in token"})
			return
		}
		roleID, _ := roleIDVal.(uint)
		set, err := ps.GetByRole(roleID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "perm lookup failed"})
			return
		}
		switch mode {
		case RequireAll:
			for _, p := range perms {
				if _, ok := set[p]; !ok {
					c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
					return
				}
			}
		default:
			okAny := false
			for _, p := range perms {
				if _, ok := set[p]; ok {
					okAny = true
					break
				}
			}
			if !okAny {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
				return
			}
		}
		c.Next()
	}
}
